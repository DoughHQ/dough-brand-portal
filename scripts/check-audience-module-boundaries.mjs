import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const audienceRoot = 'components/studies/audience/'
const audienceDomainRoot = 'lib/studies/audience/'
const audienceActions = 'app/(portal)/studies/audienceActions.ts'
const taxonomyModule = 'lib/studies/taxonomy.ts'
let failed = false

function fail(message) {
  console.error(`BAN FAIL: ${message}`)
  failed = true
}

function readModule(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) {
    fail(`missing audience module: ${relativePath}`)
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

function moduleDependencies(file) {
  const dependencies = new Set()
  for (const statement of file?.statements ?? []) {
    if (
      (ts.isImportDeclaration(statement) ||
        ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      dependencies.add(statement.moduleSpecifier.text)
    }
  }
  function visit(node) {
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
    `${basePath}/index.ts`,
    `${basePath}/index.tsx`,
  ]) {
    if (fs.existsSync(path.join(root, candidate))) return candidate
  }
  return null
}

function topLevelDeclarations(file) {
  const names = new Set()
  for (const statement of file?.statements ?? []) {
    if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement)) &&
      statement.name
    ) {
      names.add(statement.name.text)
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text)
      }
    }
  }
  return names
}

function requireImports(relativePath, requiredImports) {
  const imports = moduleDependencies(sourceFile(relativePath))
  for (const requiredImport of requiredImports) {
    if (!imports.has(requiredImport)) {
      fail(`${relativePath} must import ${requiredImport}`)
    }
  }
}

function forbidDeclarations(relativePath, forbiddenNames) {
  const declarations = topLevelDeclarations(sourceFile(relativePath))
  for (const forbiddenName of forbiddenNames) {
    if (declarations.has(forbiddenName)) {
      fail(`${relativePath} must not declare ${forbiddenName}`)
    }
  }
}

function enforceLineBudget(relativePath, limit) {
  const source = readModule(relativePath)
  if (source == null) return
  const lines = source.split(/\r?\n/).length - (source.endsWith('\n') ? 1 : 0)
  if (lines > limit) {
    fail(`${relativePath} exceeds its ${limit}-line responsibility budget (${lines})`)
  }
}

function isAudienceModule(relativePath) {
  return (
    relativePath?.startsWith(audienceRoot) === true ||
    relativePath?.startsWith(audienceDomainRoot) === true ||
    relativePath === audienceActions ||
    relativePath === taxonomyModule ||
    relativePath === 'app/(portal)/studies/box/AudienceSection.tsx' ||
    relativePath === 'app/(portal)/studies/concept/AudienceSection.tsx'
  )
}

function enforceAllowedAudienceImports(relativePath, allowedImports) {
  const allowed = new Set(allowedImports)
  for (const specifier of moduleDependencies(sourceFile(relativePath))) {
    const resolved = resolveImport(relativePath, specifier)
    if (isAudienceModule(resolved) && !allowed.has(resolved)) {
      fail(`${relativePath} must not depend on ${resolved}`)
    }
  }
}

function forbidRouteDomainImports(relativePath) {
  for (const specifier of moduleDependencies(sourceFile(relativePath))) {
    const resolved = resolveImport(relativePath, specifier)
    if (
      resolved?.startsWith('app/(portal)/studies/box/') ||
      resolved?.startsWith('app/(portal)/studies/concept/')
    ) {
      fail(`${relativePath} must not depend on route-domain module ${resolved}`)
    }
  }
}

function forbidStudyDomainImports(relativePath) {
  for (const specifier of moduleDependencies(sourceFile(relativePath))) {
    const resolved = resolveImport(relativePath, specifier)
    if (
      resolved?.startsWith('lib/box/') ||
      resolved?.startsWith('lib/concept/')
    ) {
      fail(`${relativePath} must not depend on study-domain module ${resolved}`)
    }
  }
}

function enforceAcyclicGraph(relativePaths) {
  const modules = new Set(relativePaths)
  const graph = new Map(
    relativePaths.map((relativePath) => [
      relativePath,
      [...moduleDependencies(sourceFile(relativePath))]
        .map((specifier) => resolveImport(relativePath, specifier))
        .filter((dependency) => dependency != null && modules.has(dependency)),
    ]),
  )
  const visiting = new Set()
  const visited = new Set()

  function visit(relativePath, trail) {
    if (visiting.has(relativePath)) {
      fail(`audience module cycle: ${[...trail, relativePath].join(' -> ')}`)
      return
    }
    if (visited.has(relativePath)) return
    visiting.add(relativePath)
    for (const dependency of graph.get(relativePath) ?? []) {
      visit(dependency, [...trail, relativePath])
    }
    visiting.delete(relativePath)
    visited.add(relativePath)
  }

  for (const relativePath of relativePaths) visit(relativePath, [])
}

const boxShell = 'app/(portal)/studies/box/AudienceSection.tsx'
const boxEstimateHead = 'app/(portal)/studies/box/audience/AudienceEstimateHead.tsx'
const boxEstimateNote = 'app/(portal)/studies/box/audience/AudienceEstimateNote.tsx'
const boxAudienceCategory = 'app/(portal)/studies/box/audience/BoxAudienceCategory.tsx'
const boxAudienceNarrowing = 'app/(portal)/studies/box/audience/BoxAudienceNarrowing.tsx'
const boxAudienceHook = 'app/(portal)/studies/box/audience/useBoxAudience.ts'
const conceptShell = 'app/(portal)/studies/concept/AudienceSection.tsx'
const shellImports = [
  '@/components/studies/audience/AudienceSummary',
  '@/components/studies/audience/CategoryRequirementPanel',
  '@/components/studies/audience/NarrowingPanel',
  '@/components/studies/audience/useAudiencePanelState',
  '@/components/studies/audience/useAudienceReferenceData',
]
requireImports(boxShell, [
  '@/components/studies/audience/AudienceSummary',
  '@/components/studies/audience/BoxExperienceTier',
])
requireImports(boxEstimateHead, ['@/components/studies/audience/styles'])
requireImports(boxEstimateNote, ['@/components/studies/audience/styles'])
requireImports(boxAudienceCategory, [
  '@/components/studies/audience/CategoryRequirementPanel',
  '@/components/studies/audience/types',
])
requireImports(boxAudienceNarrowing, [
  '@/components/studies/audience/NarrowingPanel',
  '@/components/studies/audience/types',
])
requireImports(boxAudienceHook, [
  '@/components/studies/audience/useAudiencePanelState',
  '@/components/studies/audience/useAudienceReferenceData',
  '@/components/studies/audience/useBoxQualifierEstimate',
])
requireImports(conceptShell, shellImports)
enforceAllowedAudienceImports(
  boxShell,
  [
    '@/components/studies/audience/AudienceSummary',
    '@/components/studies/audience/BoxExperienceTier',
  ].map((specifier) => resolveImport(boxShell, specifier)),
)
enforceAllowedAudienceImports(
  boxEstimateHead,
  ['@/components/studies/audience/styles'].map((specifier) =>
    resolveImport(boxEstimateHead, specifier),
  ),
)
enforceAllowedAudienceImports(
  boxEstimateNote,
  ['@/components/studies/audience/styles'].map((specifier) =>
    resolveImport(boxEstimateNote, specifier),
  ),
)
enforceAllowedAudienceImports(
  boxAudienceCategory,
  [
    '@/components/studies/audience/CategoryRequirementPanel',
    '@/components/studies/audience/types',
    '@/lib/studies/taxonomy',
  ].map((specifier) => resolveImport(boxAudienceCategory, specifier)),
)
enforceAllowedAudienceImports(
  boxAudienceNarrowing,
  [
    '@/components/studies/audience/NarrowingPanel',
    '@/components/studies/audience/types',
    '@/lib/studies/audience/dietaryFlags',
  ].map((specifier) => resolveImport(boxAudienceNarrowing, specifier)),
)
enforceAllowedAudienceImports(
  boxAudienceHook,
  [
    '@/components/studies/audience/useAudiencePanelState',
    '@/components/studies/audience/useAudienceReferenceData',
    '@/components/studies/audience/useBoxQualifierEstimate',
  ].map((specifier) => resolveImport(boxAudienceHook, specifier)),
)
enforceAllowedAudienceImports(
  conceptShell,
  [
    ...shellImports,
    '@/components/studies/audience/styles',
  ].map((specifier) => resolveImport(conceptShell, specifier)),
)
forbidDeclarations(boxShell, [
  'BarInput',
  'InfoButton',
  'intFromInput',
  'useBoxQualifierEstimate',
])
forbidDeclarations(conceptShell, [
  'BarInput',
  'InfoButton',
  'intFromInput',
])

const internalDependencies = {
  [`${audienceRoot}types.ts`]: [],
  [`${audienceRoot}integer.ts`]: [],
  [`${audienceRoot}styles.ts`]: [],
  [`${audienceRoot}AudienceControls.tsx`]: [
    `${audienceRoot}integer.ts`,
    `${audienceRoot}styles.ts`,
  ],
  [`${audienceRoot}AudienceSummary.tsx`]: [
    `${audienceRoot}styles.ts`,
  ],
  [`${audienceRoot}BoxExperienceTier.tsx`]: [
    `${audienceRoot}AudienceControls.tsx`,
    `${audienceRoot}styles.ts`,
  ],
  [`${audienceRoot}CategoryCombobox.tsx`]: [
    audienceActions,
    taxonomyModule,
    `${audienceRoot}styles.ts`,
  ],
  [`${audienceRoot}CategoryRequirementPanel.tsx`]: [
    `${audienceRoot}AudienceControls.tsx`,
    `${audienceRoot}CategoryCombobox.tsx`,
    `${audienceRoot}styles.ts`,
    `${audienceRoot}types.ts`,
    `${audienceDomainRoot}categoryLevels.ts`,
    `${audienceDomainRoot}copy.ts`,
    taxonomyModule,
  ],
  [`${audienceRoot}DietarySelector.tsx`]: [
    `${audienceDomainRoot}dietaryFlags.ts`,
    `${audienceRoot}styles.ts`,
  ],
  [`${audienceRoot}NarrowingPanel.tsx`]: [
    `${audienceDomainRoot}dietaryFlags.ts`,
    `${audienceRoot}DietarySelector.tsx`,
    `${audienceRoot}StateMultiSelect.tsx`,
    `${audienceRoot}integer.ts`,
    `${audienceRoot}styles.ts`,
    `${audienceRoot}types.ts`,
  ],
  [`${audienceRoot}StateMultiSelect.tsx`]: [
    `${audienceDomainRoot}usStates.ts`,
  ],
  [`${audienceRoot}useAudiencePanelState.ts`]: [
    `${audienceRoot}types.ts`,
  ],
  [`${audienceRoot}useAudienceReferenceData.ts`]: [
    audienceActions,
    `${audienceDomainRoot}dietaryFlags.ts`,
    taxonomyModule,
  ],
  [`${audienceRoot}useBoxQualifierEstimate.ts`]: [],
  [audienceActions]: [taxonomyModule],
  [taxonomyModule]: [],
  [`${audienceDomainRoot}categoryLevels.ts`]: [],
  [`${audienceDomainRoot}copy.ts`]: [],
  [`${audienceDomainRoot}dietaryFlags.ts`]: [],
  [`${audienceDomainRoot}usStates.ts`]: [],
}

const crossStudyModules = new Set([
  `${audienceRoot}AudienceControls.tsx`,
  `${audienceRoot}AudienceSummary.tsx`,
  `${audienceRoot}CategoryCombobox.tsx`,
  `${audienceRoot}CategoryRequirementPanel.tsx`,
  `${audienceRoot}DietarySelector.tsx`,
  `${audienceRoot}NarrowingPanel.tsx`,
  `${audienceRoot}StateMultiSelect.tsx`,
  `${audienceRoot}integer.ts`,
  `${audienceRoot}styles.ts`,
  `${audienceRoot}types.ts`,
  `${audienceRoot}useAudiencePanelState.ts`,
  `${audienceRoot}useAudienceReferenceData.ts`,
])

const moduleDirectory = path.join(root, audienceRoot)
const domainDirectory = path.join(root, audienceDomainRoot)
const discoveredModules = [
  ...fs.readdirSync(moduleDirectory, { recursive: true }).map((entry) =>
    path.posix.join(audienceRoot, String(entry).replaceAll(path.sep, '/')),
  ),
  ...fs.readdirSync(domainDirectory, { recursive: true }).map((entry) =>
    path.posix.join(
      audienceDomainRoot,
      String(entry).replaceAll(path.sep, '/'),
    ),
  ),
  audienceActions,
  taxonomyModule,
]
  .filter(
    (entry) =>
      !entry.includes('/__tests__/') &&
      (entry.endsWith('.ts') || entry.endsWith('.tsx')),
  )
for (const relativePath of discoveredModules) {
  if (!(relativePath in internalDependencies)) {
    fail(`audience module is missing from the dependency contract: ${relativePath}`)
  }
}

for (const [relativePath, dependencies] of Object.entries(
  internalDependencies,
)) {
  enforceAllowedAudienceImports(relativePath, dependencies)
  if (
    relativePath.startsWith(audienceRoot) ||
    relativePath.startsWith(audienceDomainRoot) ||
    relativePath === taxonomyModule
  ) {
    forbidRouteDomainImports(relativePath)
  }
  if (
    crossStudyModules.has(relativePath) ||
    relativePath.startsWith(audienceDomainRoot) ||
    relativePath === audienceActions ||
    relativePath === taxonomyModule
  ) {
    forbidStudyDomainImports(relativePath)
  }
}

for (const [relativePath, limit] of Object.entries({
  [boxShell]: 225,
  [conceptShell]: 225,
  [`${audienceRoot}AudienceControls.tsx`]: 175,
  [`${audienceRoot}AudienceSummary.tsx`]: 75,
  [`${audienceRoot}BoxExperienceTier.tsx`]: 125,
  [`${audienceRoot}CategoryCombobox.tsx`]: 350,
  [`${audienceRoot}CategoryRequirementPanel.tsx`]: 200,
  [`${audienceRoot}DietarySelector.tsx`]: 175,
  [`${audienceRoot}NarrowingPanel.tsx`]: 200,
  [`${audienceRoot}StateMultiSelect.tsx`]: 300,
  [`${audienceRoot}integer.ts`]: 25,
  [`${audienceRoot}styles.ts`]: 150,
  [`${audienceRoot}types.ts`]: 50,
  [`${audienceRoot}useAudiencePanelState.ts`]: 75,
  [`${audienceRoot}useAudienceReferenceData.ts`]: 125,
  [`${audienceRoot}useBoxQualifierEstimate.ts`]: 100,
  [audienceActions]: 75,
  [taxonomyModule]: 75,
  [`${audienceDomainRoot}categoryLevels.ts`]: 75,
  [`${audienceDomainRoot}copy.ts`]: 25,
  [`${audienceDomainRoot}dietaryFlags.ts`]: 100,
  [`${audienceDomainRoot}usStates.ts`]: 125,
})) {
  enforceLineBudget(relativePath, limit)
}

enforceAcyclicGraph([
  boxShell,
  boxEstimateHead,
  boxEstimateNote,
  boxAudienceCategory,
  boxAudienceNarrowing,
  boxAudienceHook,
  conceptShell,
  ...Object.keys(internalDependencies),
])

if (failed) process.exit(1)
console.log('check-audience-module-boundaries: ok')
