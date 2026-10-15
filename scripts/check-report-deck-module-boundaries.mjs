import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const conceptRoot = 'components/conceptReport/'
const experiencedRoot = 'components/experiencedReport/'
const evidenceRoot = `${experiencedRoot}ihutEvidence/`
const conceptShell = `${conceptRoot}ConceptReportDeck.tsx`
const experiencedShell = `${experiencedRoot}ExperiencedReportDeck.tsx`
const evidenceFacade = `${experiencedRoot}IhutEvidencePack.tsx`
const storyRoot = `${experiencedRoot}story/`
const conceptStoryRoot = `${conceptRoot}story/`
const conceptStoryReport = `${conceptRoot}ConceptStoryReport.tsx`
const storyReport = `${experiencedRoot}ExperiencedStoryReport.tsx`
const briefRoot = `${experiencedRoot}brief/`
const briefFacade = `${experiencedRoot}DecisionBrief.tsx`
let failed = false

function fail(message) {
  console.error(`BAN FAIL: ${message}`)
  failed = true
}

function readModule(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) {
    fail(`missing report-deck module: ${relativePath}`)
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
  [conceptShell]: [
    `${conceptRoot}DeckColdOpen.tsx`,
    `${conceptRoot}DeckFieldCast.tsx`,
    `${conceptRoot}DeckLadder.tsx`,
    `${conceptRoot}DeckMatchups.tsx`,
    `${conceptRoot}DeckQuestions.tsx`,
    `${conceptRoot}DeckTrust.tsx`,
    `${conceptRoot}DeckVerdictNext.tsx`,
    `${conceptRoot}conceptDeckShared.tsx`,
  ],
  [`${conceptRoot}DeckColdOpen.tsx`]: [
    `${conceptRoot}conceptDeckShared.tsx`,
  ],
  [`${conceptRoot}DeckFieldCast.tsx`]: [
    `${conceptRoot}conceptDeckShared.tsx`,
  ],
  [`${conceptRoot}DeckLadder.tsx`]: [
    `${conceptRoot}conceptDeckShared.tsx`,
  ],
  [`${conceptRoot}DeckMatchups.tsx`]: [
    `${conceptRoot}conceptDeckShared.tsx`,
  ],
  [`${conceptRoot}DeckQuestions.tsx`]: [],
  [`${conceptRoot}DeckTrust.tsx`]: [
    `${conceptRoot}conceptDeckShared.tsx`,
  ],
  [`${conceptRoot}DeckVerdictNext.tsx`]: [
    `${conceptRoot}conceptDeckShared.tsx`,
  ],
  [`${conceptRoot}conceptDeckShared.tsx`]: [],

  [conceptStoryReport]: [
    `${conceptStoryRoot}ChoiceChapter.tsx`,
    `${conceptStoryRoot}FirstLookChapter.tsx`,
    `${conceptStoryRoot}MethodChapter.tsx`,
    `${conceptStoryRoot}PriceChapter.tsx`,
    `${conceptStoryRoot}VoicesChapter.tsx`,
    `${conceptStoryRoot}storyFormat.ts`,
  ],
  [`${conceptStoryRoot}ChoiceChapter.tsx`]: [`${conceptStoryRoot}storyFormat.ts`],
  [`${conceptStoryRoot}DemandCurve.tsx`]: [`${conceptStoryRoot}storyFormat.ts`],
  [`${conceptStoryRoot}DistributionRows.tsx`]: [`${conceptStoryRoot}storyFormat.ts`],
  [`${conceptStoryRoot}FirstLookChapter.tsx`]: [
    `${conceptStoryRoot}DistributionRows.tsx`,
    `${conceptStoryRoot}storyFormat.ts`,
  ],
  [`${conceptStoryRoot}MethodChapter.tsx`]: [],
  [`${conceptStoryRoot}PriceChapter.tsx`]: [
    `${conceptStoryRoot}DemandCurve.tsx`,
    `${conceptStoryRoot}storyFormat.ts`,
  ],
  [`${conceptStoryRoot}VoicesChapter.tsx`]: [
    `${conceptStoryRoot}DistributionRows.tsx`,
    `${conceptStoryRoot}storyFormat.ts`,
  ],
  [`${conceptStoryRoot}storyFormat.ts`]: [],

  [experiencedShell]: [
    storyReport,
    `${experiencedRoot}LegacyAttributeImportanceSection.tsx`,
    `${experiencedRoot}LegacyDeckColdOpen.tsx`,
    `${experiencedRoot}LegacyDriversSection.tsx`,
    `${experiencedRoot}LegacyFieldSection.tsx`,
    `${experiencedRoot}LegacyLiftSection.tsx`,
    `${experiencedRoot}LegacyLoyaltySection.tsx`,
    `${experiencedRoot}LegacyRankValidationSection.tsx`,
    `${experiencedRoot}LegacyTrustSection.tsx`,
    `${experiencedRoot}LegacyVerdictSection.tsx`,
    `${experiencedRoot}legacyMethodNotes.ts`,
  ],
  [`${experiencedRoot}LegacyAttributeImportanceSection.tsx`]: [
    `${experiencedRoot}legacyDeckShared.tsx`,
  ],
  [`${experiencedRoot}LegacyDeckColdOpen.tsx`]: [],
  [`${experiencedRoot}LegacyDriversSection.tsx`]: [],
  [`${experiencedRoot}LegacyFieldSection.tsx`]: [
    `${experiencedRoot}legacyDeckShared.tsx`,
  ],
  [`${experiencedRoot}LegacyLiftSection.tsx`]: [
    `${experiencedRoot}legacyDeckShared.tsx`,
  ],
  [`${experiencedRoot}LegacyLoyaltySection.tsx`]: [
    `${experiencedRoot}legacyDeckShared.tsx`,
  ],
  [`${experiencedRoot}LegacyRankValidationSection.tsx`]: [
    `${experiencedRoot}legacyDeckShared.tsx`,
  ],
  [`${experiencedRoot}LegacyTrustSection.tsx`]: [
    `${experiencedRoot}legacyDeckShared.tsx`,
  ],
  [`${experiencedRoot}LegacyVerdictSection.tsx`]: [
    `${experiencedRoot}legacyDeckShared.tsx`,
  ],
  [`${experiencedRoot}legacyDeckShared.tsx`]: [],
  [`${experiencedRoot}legacyMethodNotes.ts`]: [],

  [storyReport]: [
    briefFacade,
    `${storyRoot}EvidenceChapter.tsx`,
    `${storyRoot}IntentChapter.tsx`,
    `${storyRoot}MethodChapter.tsx`,
    `${storyRoot}RepurchaseChart.tsx`,
    `${storyRoot}WhyChapter.tsx`,
    `${storyRoot}storyFormat.ts`,
  ],
  [`${storyRoot}AttributeChart.tsx`]: [],
  [`${storyRoot}DriverChart.tsx`]: [`${storyRoot}storyFormat.ts`],
  [`${storyRoot}EvidenceChapter.tsx`]: [
    briefFacade,
    `${storyRoot}storyFormat.ts`,
  ],
  [`${storyRoot}IntentChapter.tsx`]: [
    `${storyRoot}RepurchaseChart.tsx`,
    `${storyRoot}storyFormat.ts`,
  ],
  [`${storyRoot}MethodChapter.tsx`]: [
    `${storyRoot}RepurchaseChart.tsx`,
    `${storyRoot}storyFormat.ts`,
  ],
  [`${storyRoot}RepurchaseChart.tsx`]: [`${storyRoot}storyFormat.ts`],
  [`${storyRoot}WhyChapter.tsx`]: [
    `${storyRoot}AttributeChart.tsx`,
    `${storyRoot}DriverChart.tsx`,
  ],
  [`${storyRoot}storyFormat.ts`]: [],

  [briefFacade]: [
    `${briefRoot}DecisionBriefHeader.tsx`,
    `${briefRoot}EvidenceStrip.tsx`,
    `${briefRoot}HeadToHeadForest.tsx`,
    `${briefRoot}OverviewBottomLine.tsx`,
    `${briefRoot}PreferenceIntervalBar.tsx`,
  ],
  [`${briefRoot}DecisionBriefHeader.tsx`]: [`${briefRoot}OverviewBottomLine.tsx`],
  [`${briefRoot}EvidenceStrip.tsx`]: [],
  [`${briefRoot}FieldProofStrip.tsx`]: [`${briefRoot}briefCalls.ts`],
  [`${briefRoot}HeadToHeadForest.tsx`]: [`${briefRoot}briefCalls.ts`],
  [`${briefRoot}OverviewBottomLine.tsx`]: [
    `${briefRoot}FieldProofStrip.tsx`,
    `${briefRoot}PreferenceIntervalBar.tsx`,
    `${briefRoot}briefCalls.ts`,
  ],
  [`${briefRoot}PreferenceIntervalBar.tsx`]: [],
  [`${briefRoot}briefCalls.ts`]: [],

  [evidenceFacade]: [
    `${evidenceRoot}AttributeEvidenceChapter.tsx`,
    `${evidenceRoot}BuyOrderEvidenceChapter.tsx`,
    `${evidenceRoot}Day2EvidenceChapter.tsx`,
    `${evidenceRoot}EvidencePackNavigation.tsx`,
    `${evidenceRoot}ExpectationEvidenceChapter.tsx`,
    `${evidenceRoot}FieldEvidenceChapter.tsx`,
    `${evidenceRoot}LikingEvidenceChapter.tsx`,
    `${evidenceRoot}WhyEvidenceChapter.tsx`,
  ],
  [`${evidenceRoot}AttributeEvidenceChapter.tsx`]: [
    `${evidenceRoot}AttributeJarBook.tsx`,
    `${evidenceRoot}format.ts`,
  ],
  [`${evidenceRoot}AttributeJarBook.tsx`]: [`${evidenceRoot}format.ts`],
  [`${evidenceRoot}BuyOrderEvidenceChapter.tsx`]: [
    `${evidenceRoot}ShareTable.tsx`,
    `${evidenceRoot}format.ts`,
  ],
  [`${evidenceRoot}CountBanks.tsx`]: [`${evidenceRoot}format.ts`],
  [`${evidenceRoot}Day2EvidenceChapter.tsx`]: [
    `${evidenceRoot}CountBanks.tsx`,
    `${evidenceRoot}format.ts`,
  ],
  [`${evidenceRoot}EvidencePackNavigation.tsx`]: [],
  [`${evidenceRoot}ExpectationEvidenceChapter.tsx`]: [
    `${evidenceRoot}ShareTable.tsx`,
    `${evidenceRoot}format.ts`,
  ],
  [`${evidenceRoot}FieldEvidenceChapter.tsx`]: [
    `${evidenceRoot}rankEvidence.tsx`,
  ],
  [`${evidenceRoot}LikingEvidenceChapter.tsx`]: [
    `${evidenceRoot}ShareTable.tsx`,
    `${evidenceRoot}format.ts`,
  ],
  [`${evidenceRoot}ShareTable.tsx`]: [`${evidenceRoot}format.ts`],
  [`${evidenceRoot}WhyEvidenceChapter.tsx`]: [
    `${evidenceRoot}CountBanks.tsx`,
  ],
  [`${evidenceRoot}format.ts`]: [],
  [`${evidenceRoot}rankEvidence.tsx`]: [],
}

const trackedModules = new Set(Object.keys(dependencies))

/** Pre-existing modules that share a directory but are not part of an extracted deck. */
const neighborModules = new Set([
  `${conceptRoot}CombatantPortrait.tsx`,
  `${conceptRoot}ConceptTestReportDeck.tsx`,
  `${conceptRoot}ExportReportButton.tsx`,
  `${conceptRoot}SimulatedDataBanner.tsx`,
  `${conceptRoot}WinRateTrack.tsx`,
  `${conceptRoot}WtpDemandCurve.tsx`,
  `${experiencedRoot}DecisionChapters.tsx`,
  `${experiencedRoot}ExecutiveSummaryStrip.tsx`,
  `${experiencedRoot}ExperienceSplitLabel.tsx`,
  `${experiencedRoot}IhutStoryReport.tsx`,
  `${experiencedRoot}ReportSectionRail.tsx`,
  `${experiencedRoot}WithheldMetric.tsx`,
  `${experiencedRoot}deckChrome.tsx`,
  `${experiencedRoot}index.ts`,
  `${experiencedRoot}reportSections.ts`,
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

function inReportTree(relativePath) {
  return (
    relativePath?.startsWith(conceptRoot) === true ||
    relativePath?.startsWith(experiencedRoot) === true
  )
}

function isDeckModule(relativePath) {
  return (
    inReportTree(relativePath) &&
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

for (const relativePath of [
  ...listSourceFiles(conceptRoot),
  ...listSourceFiles(experiencedRoot),
]) {
  if (isDeckModule(relativePath) && !trackedModules.has(relativePath)) {
    fail(`report-deck module is missing from the dependency contract: ${relativePath}`)
  }
}
for (const relativePath of trackedModules) {
  if (!isDeckModule(relativePath)) {
    fail(`dependency contract lists a module outside report-deck ownership: ${relativePath}`)
  }
}

for (const entryPoint of [
  conceptShell,
  experiencedShell,
  evidenceFacade,
  storyReport,
  conceptStoryReport,
  briefFacade,
]) {
  const actual = new Set(
    [...moduleDependencies(entryPoint)]
      .map((specifier) => resolveImport(entryPoint, specifier))
      .filter((resolved) => resolved != null),
  )
  for (const required of dependencies[entryPoint]) {
    if (!actual.has(required)) {
      fail(`${entryPoint} must depend on ${required}`)
    }
  }
}

for (const [relativePath, allowedDependencies] of Object.entries(dependencies)) {
  const allowed = new Set(allowedDependencies)
  for (const resolved of resolvedDependencies(relativePath)) {
    if (!isDeckModule(resolved)) continue
    if (!allowed.has(resolved)) {
      fail(`${relativePath} must not depend on ${resolved}`)
    }
  }
}

const visiting = new Set()
const visited = new Set()
function visit(relativePath, trail) {
  if (visiting.has(relativePath)) {
    fail(`report-deck module cycle: ${[...trail, relativePath].join(' -> ')}`)
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
    if (isDeckModule(resolved)) {
      visit(resolved, trail)
      continue
    }
    if (
      !inReportTree(resolved) ||
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
  [conceptShell]: 100,
  [`${conceptRoot}DeckQuestions.tsx`]: 325,
  [`${conceptRoot}DeckVerdictNext.tsx`]: 275,
  [experiencedShell]: 225,
  [`${experiencedRoot}LegacyTrustSection.tsx`]: 275,
  [evidenceFacade]: 30,
  [storyReport]: 150,
  [conceptStoryReport]: 165,
  [briefFacade]: 15,
  [`${evidenceRoot}FieldEvidenceChapter.tsx`]: 175,
}
for (const relativePath of trackedModules) {
  const source = readModule(relativePath)
  if (source == null) continue
  const lines = source.split(/\r?\n/).length - (source.endsWith('\n') ? 1 : 0)
  const limit = budgets[relativePath] ?? 200
  if (lines > limit) {
    fail(`${relativePath} exceeds its ${limit}-line responsibility budget (${lines})`)
  }
}

if (failed) process.exit(1)
console.log('check-report-deck-module-boundaries: ok')
