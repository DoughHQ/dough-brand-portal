import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const brandHomeRoot = 'components/brandHome/home/'
const brandHomeShell = 'components/brandHome/BrandHome.tsx'
let failed = false

function fail(message) {
  console.error(`BAN FAIL: ${message}`)
  failed = true
}

function readModule(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) {
    fail(`missing brand-home module: ${relativePath}`)
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
  [brandHomeShell]: [
    `${brandHomeRoot}AttentionPanel.tsx`,
    `${brandHomeRoot}CategoriesSection.tsx`,
    `${brandHomeRoot}HomeAside.tsx`,
    `${brandHomeRoot}OpenStudiesSection.tsx`,
    `${brandHomeRoot}ProductsSection.tsx`,
    `${brandHomeRoot}SnapshotStrip.tsx`,
    `${brandHomeRoot}homeStrip.ts`,
  ],
  [`${brandHomeRoot}AttentionPanel.tsx`]: [],
  [`${brandHomeRoot}CatArt.tsx`]: [],
  [`${brandHomeRoot}CategoriesSection.tsx`]: [
    `${brandHomeRoot}CatArt.tsx`,
    `${brandHomeRoot}EmptyPanel.tsx`,
  ],
  [`${brandHomeRoot}EmptyPanel.tsx`]: [],
  [`${brandHomeRoot}HomeAside.tsx`]: [],
  [`${brandHomeRoot}OpenStudiesSection.tsx`]: [`${brandHomeRoot}EmptyPanel.tsx`],
  [`${brandHomeRoot}ProductsSection.tsx`]: [`${brandHomeRoot}EmptyPanel.tsx`],
  [`${brandHomeRoot}SnapshotStrip.tsx`]: [
    `${brandHomeRoot}StripIcon.tsx`,
    `${brandHomeRoot}homeStrip.ts`,
  ],
  [`${brandHomeRoot}StripIcon.tsx`]: [],
  [`${brandHomeRoot}homeModel.ts`]: [],
  [`${brandHomeRoot}homeStrip.ts`]: [`${brandHomeRoot}homeModel.ts`],
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

function isBrandHomeModule(relativePath) {
  return (
    (relativePath === brandHomeShell || relativePath?.startsWith(brandHomeRoot) === true) &&
    /\.(ts|tsx|js|jsx)$/.test(relativePath) &&
    !relativePath.includes('/__tests__/')
  )
}

function resolvedDependencies(relativePath) {
  return [...moduleDependencies(relativePath)]
    .map((specifier) => resolveImport(relativePath, specifier))
    .filter((resolved) => resolved != null)
}

for (const relativePath of [brandHomeShell, ...listSourceFiles(brandHomeRoot)]) {
  if (isBrandHomeModule(relativePath) && !trackedModules.has(relativePath)) {
    fail(`brand-home module is missing from the dependency contract: ${relativePath}`)
  }
}
for (const relativePath of trackedModules) {
  if (!isBrandHomeModule(relativePath)) {
    fail(`dependency contract lists a module outside brand-home: ${relativePath}`)
  }
}

const shellDeps = new Set(resolvedDependencies(brandHomeShell))
for (const required of dependencies[brandHomeShell]) {
  if (!shellDeps.has(required)) fail(`${brandHomeShell} must depend on ${required}`)
}

for (const [relativePath, allowedDependencies] of Object.entries(dependencies)) {
  const allowed = new Set(allowedDependencies)
  for (const resolved of resolvedDependencies(relativePath)) {
    if (!isBrandHomeModule(resolved)) continue
    if (!allowed.has(resolved)) {
      fail(`${relativePath} must not depend on ${resolved}`)
    }
  }
}

const visiting = new Set()
const visited = new Set()
function visit(relativePath, trail) {
  if (visiting.has(relativePath)) {
    fail(`brand-home module cycle: ${[...trail, relativePath].join(' -> ')}`)
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
    if (isBrandHomeModule(resolved)) visit(resolved, trail)
  }
}
for (const relativePath of trackedModules) visit(relativePath, [])

const budgets = {
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
console.log('check-brand-home-module-boundaries: ok')
