import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const boxRoot = 'app/(portal)/studies/box/'
const conceptRoot = 'app/(portal)/studies/concept/'
const contentsRoot = `${boxRoot}contents/`
const competitorsRoot = `${conceptRoot}competitors/`
const contentsShell = `${boxRoot}ContentsSection.tsx`
const competitorsShell = `${conceptRoot}CompetitorsColumn.tsx`
let failed = false

function fail(message) {
  console.error(`BAN FAIL: ${message}`)
  failed = true
}

function readModule(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) {
    fail(`missing study-setup module: ${relativePath}`)
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
  [contentsShell]: [
    `${contentsRoot}ContentsAddActions.tsx`,
    `${contentsRoot}ContentsComposer.tsx`,
    `${contentsRoot}ContentsEmptyState.tsx`,
    `${contentsRoot}ContentsSeatCard.tsx`,
    `${contentsRoot}priceReadiness.ts`,
    `${contentsRoot}useContentsField.ts`,
  ],
  [`${contentsRoot}catalogSeat.ts`]: [],
  [`${contentsRoot}ContentsAddActions.tsx`]: [`${contentsRoot}types.ts`],
  [`${contentsRoot}ContentsComposer.tsx`]: [`${contentsRoot}types.ts`],
  [`${contentsRoot}ContentsEmptyState.tsx`]: [
    `${contentsRoot}ContentsAddActions.tsx`,
    `${contentsRoot}types.ts`,
  ],
  [`${contentsRoot}ContentsSeatCard.tsx`]: [
    `${contentsRoot}ShelfPriceInput.tsx`,
    `${contentsRoot}types.ts`,
  ],
  [`${contentsRoot}priceReadiness.ts`]: [],
  [`${contentsRoot}ShelfPriceInput.tsx`]: [],
  [`${contentsRoot}types.ts`]: [],
  [`${contentsRoot}useContentsField.ts`]: [
    `${contentsRoot}catalogSeat.ts`,
    `${contentsRoot}types.ts`,
  ],

  [competitorsShell]: [
    `${competitorsRoot}CompetitorColumnHead.tsx`,
    `${competitorsRoot}CompetitorEmptyState.tsx`,
    `${competitorsRoot}CompetitorSearchSlot.tsx`,
    `${competitorsRoot}SelectedCompetitor.tsx`,
    `${competitorsRoot}useCompetitorColumn.ts`,
  ],
  [`${competitorsRoot}CompetitorColumnHead.tsx`]: [],
  [`${competitorsRoot}CompetitorEmptyState.tsx`]: [`${competitorsRoot}ShelfGlyph.tsx`],
  [`${competitorsRoot}CompetitorSearchSlot.tsx`]: [],
  [`${competitorsRoot}SelectedCompetitor.tsx`]: [],
  [`${competitorsRoot}ShelfGlyph.tsx`]: [],
  [`${competitorsRoot}useCompetitorColumn.ts`]: [],
}

const trackedModules = new Set(Object.keys(dependencies))

/** Pre-existing study files that share a route directory but are not these shells. */
const neighborModules = new Set([
  `${boxRoot}AudienceSection.tsx`,
  `${boxRoot}BattleSection.tsx`,
  `${boxRoot}BoxAllergenConfirm.tsx`,
  `${boxRoot}BoxDraftLoader.tsx`,
  `${boxRoot}BoxProductSearchSlot.tsx`,
  `${boxRoot}BoxPrototypePickSlot.tsx`,
  `${boxRoot}BoxStudyClient.tsx`,
  `${boxRoot}BoxUpcField.tsx`,
  `${boxRoot}MethodSection.tsx`,
  `${boxRoot}SetupSection.tsx`,
  `${boxRoot}actions.ts`,
  `${boxRoot}new/page.tsx`,
  `${boxRoot}preview/BoxPreviewWalkthroughClient.tsx`,
  `${boxRoot}[draftId]/edit/page.tsx`,
  `${boxRoot}[draftId]/preview/page.tsx`,
  `${conceptRoot}AudienceSection.tsx`,
  `${conceptRoot}BuilderSectionChrome.tsx`,
  `${conceptRoot}BuilderStepper.tsx`,
  `${conceptRoot}CheckoutHandoff.tsx`,
  `${conceptRoot}ConceptArmImageUploader.tsx`,
  `${conceptRoot}ConceptStudyClient.tsx`,
  `${conceptRoot}ConfirmDialog.tsx`,
  `${conceptRoot}FieldSection.tsx`,
  `${conceptRoot}OwnProductColumn.tsx`,
  `${conceptRoot}PackSizeField.tsx`,
  `${conceptRoot}SingleTestJourneySection.tsx`,
  `${conceptRoot}StudyMasthead.tsx`,
  `${conceptRoot}StudyTypeSection.tsx`,
  `${conceptRoot}SuggestionDropdown.tsx`,
  `${conceptRoot}actions.ts`,
  `${conceptRoot}conceptCards.tsx`,
  `${conceptRoot}conceptStyles.ts`,
  `${conceptRoot}fieldIcons.tsx`,
  `${conceptRoot}new/page.tsx`,
  `${conceptRoot}preview/BattleScreen.tsx`,
  `${conceptRoot}preview/ChoiceScreen.tsx`,
  `${conceptRoot}preview/PreviewRunner.tsx`,
  `${conceptRoot}preview/PreviewWalkthroughClient.tsx`,
  `${conceptRoot}preview/ProgressHeader.tsx`,
  `${conceptRoot}preview/SampleReportFrame.tsx`,
  `${conceptRoot}preview/SampleReportScreen.tsx`,
  `${conceptRoot}preview/StimulusImage.tsx`,
  `${conceptRoot}preview/SummaryScreen.tsx`,
  `${conceptRoot}[missionId]/edit/page.tsx`,
  `${conceptRoot}[missionId]/page.tsx`,
  `${conceptRoot}[missionId]/preview/page.tsx`,
  `${conceptRoot}[missionId]/report/page.tsx`,
])

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

function inStudyTree(relativePath) {
  return (
    relativePath?.startsWith(boxRoot) === true ||
    relativePath?.startsWith(conceptRoot) === true
  )
}

const journeyRoot = `${conceptRoot}journey/`
const methodRoot = `${boxRoot}method/`
const clientRoot = `${boxRoot}client/`
const conceptClientRoot = `${conceptRoot}client/`
const cardsRoot = `${conceptRoot}cards/`
const ownProductRoot = `${conceptRoot}ownProduct/`

const studyTypeRoot = `${conceptRoot}setup/`
function isSetupModule(relativePath) {
  return (
    inStudyTree(relativePath) &&
    !relativePath?.startsWith(journeyRoot) &&
    !relativePath?.startsWith(methodRoot) &&
    !relativePath?.startsWith(clientRoot) &&
    !relativePath?.startsWith(conceptClientRoot) &&
    !relativePath?.startsWith(cardsRoot) &&
    !relativePath?.startsWith(ownProductRoot) &&
    !relativePath?.startsWith(studyTypeRoot) &&
    /\.(ts|tsx|js|jsx)$/.test(relativePath) &&
    !relativePath.includes('/__tests__/') &&
    !neighborModules.has(relativePath)
  )
}

function resolvedDependencies(relativePath) {
  return [...moduleDependencies(relativePath)]
    .map((specifier) => resolveImport(relativePath, specifier))
    .filter((resolved) => resolved != null)
}

for (const relativePath of [...listSourceFiles(boxRoot), ...listSourceFiles(conceptRoot)]) {
  if (isSetupModule(relativePath) && !trackedModules.has(relativePath)) {
    fail(`study-setup module is missing from the dependency contract: ${relativePath}`)
  }
}
for (const relativePath of trackedModules) {
  if (!isSetupModule(relativePath)) {
    fail(`dependency contract lists a module outside study-setup ownership: ${relativePath}`)
  }
}

for (const entryPoint of [contentsShell, competitorsShell]) {
  const actual = new Set(resolvedDependencies(entryPoint))
  for (const required of dependencies[entryPoint]) {
    if (!actual.has(required)) {
      fail(`${entryPoint} must depend on ${required}`)
    }
  }
}

for (const [relativePath, allowedDependencies] of Object.entries(dependencies)) {
  const allowed = new Set(allowedDependencies)
  for (const resolved of resolvedDependencies(relativePath)) {
    if (!isSetupModule(resolved)) continue
    if (!allowed.has(resolved)) {
      fail(`${relativePath} must not depend on ${resolved}`)
    }
  }
}

const visiting = new Set()
const visited = new Set()
function visit(relativePath, trail) {
  if (visiting.has(relativePath)) {
    fail(`study-setup module cycle: ${[...trail, relativePath].join(' -> ')}`)
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
    if (isSetupModule(resolved)) {
      visit(resolved, trail)
      continue
    }
    if (
      !inStudyTree(resolved) ||
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
  [contentsShell]: 190,
  [`${contentsRoot}ContentsComposer.tsx`]: 150,
  [`${contentsRoot}ContentsSeatCard.tsx`]: 340,
  [`${contentsRoot}useContentsField.ts`]: 240,
  [competitorsShell]: 150,
  [`${competitorsRoot}CompetitorSearchSlot.tsx`]: 320,
  [`${competitorsRoot}SelectedCompetitor.tsx`]: 280,
  [`${competitorsRoot}useCompetitorColumn.ts`]: 180,
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
console.log('check-study-setup-module-boundaries: ok')
