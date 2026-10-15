import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const categoryLauncherRoot = 'components/categories/launcher/'
const categoryLauncherShell = 'components/categories/CategoryLauncher.tsx'
let failed = false

function fail(message) {
  console.error(`BAN FAIL: ${message}`)
  failed = true
}

function readModule(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) {
    fail(`missing category-launcher module: ${relativePath}`)
    return null
  }
  return fs.readFileSync(absolutePath, 'utf8')
}

function sourceFile(relativePath) {
  const source = readModule(relativePath)
  if (source == null) return null
  return ts.createSourceFile(
    relativePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    relativePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
}

const dependencyCache = new Map()

function moduleDependencies(relativePath) {
  if (dependencyCache.has(relativePath)) return dependencyCache.get(relativePath)
  const dependencies = new Set()
  const file = sourceFile(relativePath)
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      dependencies.add(node.moduleSpecifier.text)
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      dependencies.add(node.arguments[0].text)
    }
    ts.forEachChild(node, visit)
  }
  if (file) visit(file)
  dependencyCache.set(relativePath, dependencies)
  return dependencies
}

function resolveImport(relativePath, specifier) {
  let basePath
  if (specifier.startsWith('@/')) {
    basePath = specifier.slice(2)
  } else if (specifier.startsWith('.')) {
    basePath = path.posix.normalize(
      path.posix.join(path.posix.dirname(relativePath), specifier),
    )
  } else {
    return null
  }
  for (const candidate of [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}/index.ts`,
    `${basePath}/index.tsx`,
    `${basePath}/index.js`,
    `${basePath}/index.jsx`,
  ]) {
    if (fs.existsSync(path.join(root, candidate))) return candidate
  }
  return null
}

const dependencies = {
  [categoryLauncherShell]: [
    `${categoryLauncherRoot}BrowseSection.tsx`,
    `${categoryLauncherRoot}CompeteSection.tsx`,
    `${categoryLauncherRoot}ExploreCard.tsx`,
    `${categoryLauncherRoot}LauncherError.tsx`,
    `${categoryLauncherRoot}LauncherSummary.tsx`,
    `${categoryLauncherRoot}OwnedCards.tsx`,
    `${categoryLauncherRoot}launcherModel.ts`,
    `${categoryLauncherRoot}launcherParts.tsx`,
    `${categoryLauncherRoot}useCategoryLauncher.ts`,
  ],
  [`${categoryLauncherRoot}BrowseSection.tsx`]: [
    `${categoryLauncherRoot}ExploreCard.tsx`,
    `${categoryLauncherRoot}launcherParts.tsx`,
    `${categoryLauncherRoot}useCategoryLauncher.ts`,
  ],
  [`${categoryLauncherRoot}CompeteCard.tsx`]: [
    `${categoryLauncherRoot}launcherModel.ts`,
    `${categoryLauncherRoot}launcherParts.tsx`,
  ],
  [`${categoryLauncherRoot}CompeteSection.tsx`]: [
    `${categoryLauncherRoot}CompeteCard.tsx`,
    `${categoryLauncherRoot}launcherParts.tsx`,
  ],
  [`${categoryLauncherRoot}ExploreCard.tsx`]: [],
  [`${categoryLauncherRoot}LauncherError.tsx`]: [],
  [`${categoryLauncherRoot}LauncherSummary.tsx`]: [`${categoryLauncherRoot}SummaryCard.tsx`],
  [`${categoryLauncherRoot}OwnedCards.tsx`]: [`${categoryLauncherRoot}launcherParts.tsx`],
  [`${categoryLauncherRoot}SummaryCard.tsx`]: [
    `${categoryLauncherRoot}launcherModel.ts`,
    `${categoryLauncherRoot}launcherParts.tsx`,
  ],
  [`${categoryLauncherRoot}launcherModel.ts`]: [],
  [`${categoryLauncherRoot}launcherParts.tsx`]: [`${categoryLauncherRoot}launcherModel.ts`],
  [`${categoryLauncherRoot}useCategoryLauncher.ts`]: [`${categoryLauncherRoot}launcherModel.ts`],
}
const trackedModules = new Set(Object.keys(dependencies))

function listSourceFiles(relativeDir) {
  const found = []
  for (const entry of fs.readdirSync(path.join(root, relativeDir), {
    withFileTypes: true,
  })) {
    if (entry.name === '__tests__') continue
    const relativePath = `${relativeDir}${entry.name}`
    if (entry.isDirectory()) {
      found.push(...listSourceFiles(`${relativePath}/`))
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      found.push(relativePath)
    }
  }
  return found
}

function isCategoryLauncherModule(relativePath) {
  return (
    (relativePath === categoryLauncherShell || relativePath?.startsWith(categoryLauncherRoot) === true) &&
    /\.(ts|tsx|js|jsx)$/.test(relativePath) &&
    !relativePath.includes('/__tests__/')
  )
}

function resolvedDependencies(relativePath) {
  return [...moduleDependencies(relativePath)]
    .map((specifier) => resolveImport(relativePath, specifier))
    .filter((resolved) => resolved != null)
}

for (const relativePath of [categoryLauncherShell, ...listSourceFiles(categoryLauncherRoot)]) {
  if (isCategoryLauncherModule(relativePath) && !trackedModules.has(relativePath)) {
    fail(`category-launcher module is missing from the dependency contract: ${relativePath}`)
  }
}
for (const relativePath of trackedModules) {
  if (!isCategoryLauncherModule(relativePath)) {
    fail(`dependency contract lists a module outside category-launcher: ${relativePath}`)
  }
}

const shellDeps = new Set(resolvedDependencies(categoryLauncherShell))
for (const required of dependencies[categoryLauncherShell]) {
  if (!shellDeps.has(required)) fail(`${categoryLauncherShell} must depend on ${required}`)
}

for (const [relativePath, allowedDependencies] of Object.entries(dependencies)) {
  const allowed = new Set(allowedDependencies)
  for (const resolved of resolvedDependencies(relativePath)) {
    if (!isCategoryLauncherModule(resolved)) continue
    if (!allowed.has(resolved)) {
      fail(`${relativePath} must not depend on ${resolved}`)
    }
  }
}

const visiting = new Set()
const visited = new Set()
function visit(relativePath, trail) {
  if (visiting.has(relativePath)) {
    fail(`category-launcher module cycle: ${[...trail, relativePath].join(' -> ')}`)
    return
  }
  if (visited.has(relativePath)) return
  visiting.add(relativePath)
  follow(relativePath, [...trail, relativePath])
  visiting.delete(relativePath)
  visited.add(relativePath)
}
function follow(relativePath, trail) {
  for (const resolved of resolvedDependencies(relativePath)) {
    if (isCategoryLauncherModule(resolved)) visit(resolved, trail)
  }
}
for (const relativePath of trackedModules) visit(relativePath, [])

const budgets = {
  [categoryLauncherShell]: 120,
}
for (const relativePath of trackedModules) {
  const source = readModule(relativePath)
  if (source == null) continue
  const lines = source.split(/\r?\n/).length - (source.endsWith('\n') ? 1 : 0)
  const limit = budgets[relativePath] ?? 100
  if (lines > limit) {
    fail(`${relativePath} exceeds its ${limit}-line responsibility budget (${lines})`)
  }
}

if (failed) process.exit(1)
console.log('check-category-launcher-module-boundaries: ok')
