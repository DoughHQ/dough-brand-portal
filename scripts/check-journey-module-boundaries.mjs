import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const journeyRoot = 'app/(portal)/studies/concept/journey/'
const journeyShell = 'app/(portal)/studies/concept/SingleTestJourneySection.tsx'
let failed = false

function fail(message) {
  console.error(`BAN FAIL: ${message}`)
  failed = true
}

function readModule(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) {
    fail(`missing journey module: ${relativePath}`)
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
  [journeyShell]: [
    `${journeyRoot}JourneySectionHead.tsx`,
    `${journeyRoot}JourneyStepList.tsx`,
    `${journeyRoot}JourneySuccessBlock.tsx`,
    `${journeyRoot}journeyLabels.ts`,
    `${journeyRoot}useSingleTestJourney.ts`,
  ],
  [`${journeyRoot}JourneyBattlePrompt.tsx`]: [],
  [`${journeyRoot}JourneyBoughtRecently.tsx`]: [],
  [`${journeyRoot}JourneyBrandQuestions.tsx`]: [`${journeyRoot}journeyChrome.tsx`],
  [`${journeyRoot}JourneySectionHead.tsx`]: [`${journeyRoot}journeyLabels.ts`],
  [`${journeyRoot}JourneyStepList.tsx`]: [
    `${journeyRoot}JourneyBattlePrompt.tsx`,
    `${journeyRoot}JourneyBoughtRecently.tsx`,
    `${journeyRoot}JourneyBrandQuestions.tsx`,
    `${journeyRoot}journeyChrome.tsx`,
    `${journeyRoot}useSingleTestJourney.ts`,
  ],
  [`${journeyRoot}JourneySuccessBars.tsx`]: [],
  [`${journeyRoot}JourneySuccessBlock.tsx`]: [
    `${journeyRoot}JourneySuccessBars.tsx`,
    `${journeyRoot}journeyChrome.tsx`,
    `${journeyRoot}useSingleTestJourney.ts`,
  ],
  [`${journeyRoot}journeyChrome.tsx`]: [],
  [`${journeyRoot}journeyLabels.ts`]: [],
  [`${journeyRoot}useSingleTestJourney.ts`]: [`${journeyRoot}journeyLabels.ts`],
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

function isJourneyModule(relativePath) {
  return (
    (relativePath === journeyShell || relativePath?.startsWith(journeyRoot) === true) &&
    /\.(ts|tsx|js|jsx)$/.test(relativePath) &&
    !relativePath.includes('/__tests__/')
  )
}

function resolvedDependencies(relativePath) {
  return [...moduleDependencies(relativePath)]
    .map((specifier) => resolveImport(relativePath, specifier))
    .filter((resolved) => resolved != null)
}

for (const relativePath of [journeyShell, ...listSourceFiles(journeyRoot)]) {
  if (isJourneyModule(relativePath) && !trackedModules.has(relativePath)) {
    fail(`journey module is missing from the dependency contract: ${relativePath}`)
  }
}
for (const relativePath of trackedModules) {
  if (!isJourneyModule(relativePath)) {
    fail(`dependency contract lists a module outside journey ownership: ${relativePath}`)
  }
}

const shellDeps = new Set(resolvedDependencies(journeyShell))
for (const required of dependencies[journeyShell]) {
  if (!shellDeps.has(required)) fail(`${journeyShell} must depend on ${required}`)
}

for (const [relativePath, allowedDependencies] of Object.entries(dependencies)) {
  const allowed = new Set(allowedDependencies)
  for (const resolved of resolvedDependencies(relativePath)) {
    if (!isJourneyModule(resolved)) continue
    if (!allowed.has(resolved)) {
      fail(`${relativePath} must not depend on ${resolved}`)
    }
  }
}

const visiting = new Set()
const visited = new Set()
function visit(relativePath, trail) {
  if (visiting.has(relativePath)) {
    fail(`journey module cycle: ${[...trail, relativePath].join(' -> ')}`)
    return
  }
  if (visited.has(relativePath)) return
  visiting.add(relativePath)
  follow(relativePath, [...trail, relativePath], new Set())
  visiting.delete(relativePath)
  visited.add(relativePath)
}
function follow(relativePath, trail, localSeen) {
  for (const resolved of resolvedDependencies(relativePath)) {
    if (isJourneyModule(resolved)) {
      visit(resolved, trail)
      continue
    }
    if (
      !resolved.startsWith('app/(portal)/studies/concept/') ||
      !/\.(ts|tsx|js|jsx)$/.test(resolved) ||
      localSeen.has(resolved)
    ) {
      continue
    }
    localSeen.add(resolved)
    follow(resolved, [...trail, resolved], localSeen)
  }
}
for (const relativePath of trackedModules) visit(relativePath, [])

const budgets = {
  [journeyShell]: 80,
  [`${journeyRoot}JourneyBrandQuestions.tsx`]: 140,
  [`${journeyRoot}JourneyStepList.tsx`]: 230,
  [`${journeyRoot}journeyChrome.tsx`]: 140,
  [`${journeyRoot}useSingleTestJourney.ts`]: 190,
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
console.log('check-journey-module-boundaries: ok')
