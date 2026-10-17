/**
 * One dependency-contract checker for the portal module splits.
 *
 * scripts/module-boundaries.config.json holds one contract per split screen.
 * A new split adds a group there, not a new script. Audience, distribution,
 * and transparency keep their own checkers: they ban declarations as well as
 * imports. The shell security bans stay too.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE_FILE = /\.(ts|tsx|js|jsx)$/

const config = JSON.parse(
  fs.readFileSync(path.join(root, 'scripts/module-boundaries.config.json'), 'utf8'),
)

let failed = false

function fail(message) {
  console.error(`BAN FAIL: ${message}`)
  failed = true
}

function readModule(relativePath, label) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) {
    fail(`missing ${label} module: ${relativePath}`)
    return null
  }
  return fs.readFileSync(absolutePath, 'utf8')
}

function sourceFile(relativePath, label) {
  const source = readModule(relativePath, label)
  if (source == null) return null
  return ts.createSourceFile(
    relativePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    relativePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
}

function moduleDependencies(relativePath, label, cache) {
  if (cache.has(relativePath)) return cache.get(relativePath)
  const dependencies = new Set()
  const file = sourceFile(relativePath, label)
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
  cache.set(relativePath, dependencies)
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

function listSourceFiles(relativeDir) {
  const found = []
  for (const entry of fs.readdirSync(path.join(root, relativeDir), {
    withFileTypes: true,
  })) {
    if (entry.name === '__tests__') continue
    const relativePath = `${relativeDir}${entry.name}`
    if (entry.isDirectory()) {
      found.push(...listSourceFiles(`${relativePath}/`))
    } else if (entry.isFile() && SOURCE_FILE.test(entry.name)) {
      found.push(relativePath)
    }
  }
  return found
}

function ownedChecker(group) {
  const shells = new Set(group.shells ?? [])
  const prefixes = group.prefixes ?? []
  const excludePrefixes = group.excludePrefixes ?? []
  const neighbors = new Set(group.neighbors ?? [])
  return function isOwned(relativePath) {
    if (typeof relativePath !== 'string') return false
    if (!SOURCE_FILE.test(relativePath)) return false
    if (relativePath.includes('/__tests__/')) return false
    if (neighbors.has(relativePath)) return false
    if (excludePrefixes.some((prefix) => relativePath.startsWith(prefix))) return false
    return shells.has(relativePath) || prefixes.some((prefix) => relativePath.startsWith(prefix))
  }
}

function resolvedDependencies(relativePath, label, cache) {
  return [...moduleDependencies(relativePath, label, cache)]
    .map((specifier) => resolveImport(relativePath, specifier))
    .filter((resolved) => resolved != null)
}

function checkGroup(group) {
  const label = group.label
  const isOwned = ownedChecker(group)
  const cache = new Map()
  const tracked = new Set(Object.keys(group.dependencies))
  const discovered = [
    ...(group.scanShells ?? []),
    ...(group.scanRoots ?? []).flatMap((relativeDir) => listSourceFiles(relativeDir)),
  ]

  for (const relativePath of discovered) {
    if (isOwned(relativePath) && !tracked.has(relativePath)) {
      fail(`${label} module is missing from the dependency contract: ${relativePath}`)
    }
  }
  for (const relativePath of tracked) {
    if (!isOwned(relativePath)) {
      fail(`dependency contract lists a module outside ${group.outside}: ${relativePath}`)
    }
  }

  for (const entryPoint of group.entryPoints) {
    const actual = new Set(resolvedDependencies(entryPoint, label, cache))
    for (const required of group.dependencies[entryPoint]) {
      if (!actual.has(required)) fail(`${entryPoint} must depend on ${required}`)
    }
  }

  for (const [relativePath, allowedDependencies] of Object.entries(group.dependencies)) {
    const allowed = new Set(allowedDependencies)
    for (const resolved of resolvedDependencies(relativePath, label, cache)) {
      if (!isOwned(resolved)) continue
      if (!allowed.has(resolved)) fail(`${relativePath} must not depend on ${resolved}`)
    }
  }

  const cycleThrough = group.cycleThrough ?? []
  const visiting = new Set()
  const visited = new Set()
  function visit(relativePath, trail) {
    if (visiting.has(relativePath)) {
      fail(`${label} module cycle: ${[...trail, relativePath].join(' -> ')}`)
      return
    }
    if (visited.has(relativePath)) return
    visiting.add(relativePath)
    follow(relativePath, [...trail, relativePath], new Set())
    visiting.delete(relativePath)
    visited.add(relativePath)
  }
  function follow(relativePath, trail, localSeen) {
    for (const resolved of resolvedDependencies(relativePath, label, cache)) {
      if (isOwned(resolved)) {
        visit(resolved, trail)
        continue
      }
      if (
        cycleThrough.length === 0 ||
        !cycleThrough.some((prefix) => resolved.startsWith(prefix)) ||
        !SOURCE_FILE.test(resolved) ||
        localSeen.has(resolved)
      ) {
        continue
      }
      localSeen.add(resolved)
      follow(resolved, [...trail, resolved], localSeen)
    }
  }
  for (const relativePath of tracked) visit(relativePath, [])

  const budgets = group.budgets ?? {}
  const defaultBudget = group.defaultBudget ?? 100
  for (const relativePath of tracked) {
    const source = readModule(relativePath, label)
    if (source == null) continue
    const lines = source.split(/\r?\n/).length - (source.endsWith('\n') ? 1 : 0)
    const limit = budgets[relativePath] ?? defaultBudget
    if (lines > limit) {
      fail(`${relativePath} exceeds its ${limit}-line responsibility budget (${lines})`)
    }
  }
}

for (const group of config.groups) checkGroup(group)

if (failed) process.exit(1)
console.log('check-module-boundaries: ok')
