import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const brandFulfillmentRoot = 'app/(portal)/studies/box/[draftId]/fulfillment/panel/'
const brandFulfillmentShell = 'app/(portal)/studies/box/[draftId]/fulfillment/BrandFulfillmentPanel.tsx'
let failed = false

function fail(message) {
  console.error(`BAN FAIL: ${message}`)
  failed = true
}

function readModule(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) {
    fail(`missing brand-fulfillment module: ${relativePath}`)
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
  [brandFulfillmentShell]: [
    `${brandFulfillmentRoot}FulfillmentConfirm.tsx`,
    `${brandFulfillmentRoot}PanelHeader.tsx`,
    `${brandFulfillmentRoot}SeatCard.tsx`,
    `${brandFulfillmentRoot}panelStyles.ts`,
    `${brandFulfillmentRoot}useBrandFulfillment.ts`,
  ],
  [`${brandFulfillmentRoot}FulfillmentConfirm.tsx`]: [`${brandFulfillmentRoot}useBrandFulfillment.ts`],
  [`${brandFulfillmentRoot}PanelHeader.tsx`]: [
    `${brandFulfillmentRoot}downloadCsv.ts`,
    `${brandFulfillmentRoot}panelStyles.ts`,
  ],
  [`${brandFulfillmentRoot}SeatActions.tsx`]: [
    `${brandFulfillmentRoot}panelStyles.ts`,
    `${brandFulfillmentRoot}useBrandFulfillment.ts`,
  ],
  [`${brandFulfillmentRoot}SeatCard.tsx`]: [
    `${brandFulfillmentRoot}SeatActions.tsx`,
    `${brandFulfillmentRoot}ShipForm.tsx`,
    `${brandFulfillmentRoot}useBrandFulfillment.ts`,
  ],
  [`${brandFulfillmentRoot}ShipForm.tsx`]: [
    `${brandFulfillmentRoot}panelStyles.ts`,
    `${brandFulfillmentRoot}useBrandFulfillment.ts`,
  ],
  [`${brandFulfillmentRoot}downloadCsv.ts`]: [],
  [`${brandFulfillmentRoot}panelStyles.ts`]: [],
  [`${brandFulfillmentRoot}useBrandFulfillment.ts`]: [],
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

function isBrandFulfillmentModule(relativePath) {
  return (
    (relativePath === brandFulfillmentShell || relativePath?.startsWith(brandFulfillmentRoot) === true) &&
    /\.(ts|tsx|js|jsx)$/.test(relativePath) &&
    !relativePath.includes('/__tests__/')
  )
}

function resolvedDependencies(relativePath) {
  return [...moduleDependencies(relativePath)]
    .map((specifier) => resolveImport(relativePath, specifier))
    .filter((resolved) => resolved != null)
}

for (const relativePath of [brandFulfillmentShell, ...listSourceFiles(brandFulfillmentRoot)]) {
  if (isBrandFulfillmentModule(relativePath) && !trackedModules.has(relativePath)) {
    fail(`brand-fulfillment module is missing from the dependency contract: ${relativePath}`)
  }
}
for (const relativePath of trackedModules) {
  if (!isBrandFulfillmentModule(relativePath)) {
    fail(`dependency contract lists a module outside brand-fulfillment: ${relativePath}`)
  }
}

const shellDeps = new Set(resolvedDependencies(brandFulfillmentShell))
for (const required of dependencies[brandFulfillmentShell]) {
  if (!shellDeps.has(required)) fail(`${brandFulfillmentShell} must depend on ${required}`)
}

for (const [relativePath, allowedDependencies] of Object.entries(dependencies)) {
  const allowed = new Set(allowedDependencies)
  for (const resolved of resolvedDependencies(relativePath)) {
    if (!isBrandFulfillmentModule(resolved)) continue
    if (!allowed.has(resolved)) {
      fail(`${relativePath} must not depend on ${resolved}`)
    }
  }
}

const visiting = new Set()
const visited = new Set()
function visit(relativePath, trail) {
  if (visiting.has(relativePath)) {
    fail(`brand-fulfillment module cycle: ${[...trail, relativePath].join(' -> ')}`)
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
    if (isBrandFulfillmentModule(resolved)) visit(resolved, trail)
  }
}
for (const relativePath of trackedModules) visit(relativePath, [])

const budgets = {
  [`${brandFulfillmentRoot}SeatCard.tsx`]: 160,
  [`${brandFulfillmentRoot}useBrandFulfillment.ts`]: 130,
  [brandFulfillmentShell]: 115,
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
console.log('check-brand-fulfillment-module-boundaries: ok')
