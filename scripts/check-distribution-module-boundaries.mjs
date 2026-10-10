import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let failed = false

function fail(message) {
  console.error(`BAN FAIL: ${message}`)
  failed = true
}

function readModule(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) {
    fail(`missing distribution module: ${relativePath}`)
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

function moduleImports(file) {
  const imports = new Set()
  for (const statement of file?.statements ?? []) {
    if (
      (ts.isImportDeclaration(statement) ||
        ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      imports.add(statement.moduleSpecifier.text)
    }
  }
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      imports.add(node.arguments[0].text)
    }
    ts.forEachChild(node, visit)
  }
  if (file) visit(file)
  return imports
}

function resolveRelativeImport(relativePath, specifier) {
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
      (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
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
  const imports = moduleImports(sourceFile(relativePath))
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

function enforceAllowedInternalImports(relativePath, allowedImports) {
  const allowed = new Set(allowedImports)
  for (const specifier of moduleImports(sourceFile(relativePath))) {
    const resolved = resolveRelativeImport(relativePath, specifier)
    if (
      (resolved === 'components/distribution/WhereItsSoldSection.tsx' ||
        resolved?.startsWith('components/distribution/whereItsSold/')) &&
      !allowed.has(resolved)
    ) {
      fail(`${relativePath} must not depend on ${resolved}`)
    }
  }
}

function enforceAcyclicGraph(relativePaths) {
  const modules = new Set(relativePaths)
  const graph = new Map(
    relativePaths.map((relativePath) => [
      relativePath,
      [...moduleImports(sourceFile(relativePath))]
        .map((specifier) => resolveRelativeImport(relativePath, specifier))
        .filter((dependency) => dependency != null && modules.has(dependency)),
    ]),
  )
  const visiting = new Set()
  const visited = new Set()

  function visit(relativePath, trail) {
    if (visiting.has(relativePath)) {
      fail(`distribution module cycle: ${[...trail, relativePath].join(' -> ')}`)
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

const shell = 'components/distribution/WhereItsSoldSection.tsx'
const shellDependencies = [
  './whereItsSold/CoordCard',
  './whereItsSold/SeedSection',
  './whereItsSold/useWhereItsSold',
  './whereItsSold/modals/AddPlaceModal',
  './whereItsSold/modals/ClaimAllModal',
  './whereItsSold/modals/DelistModal',
  './whereItsSold/modals/DisputeModal',
  './whereItsSold/modals/NationwideConfirmModal',
  './whereItsSold/types',
]
requireImports(shell, shellDependencies)
enforceAllowedInternalImports(
  shell,
  shellDependencies.map((specifier) => resolveRelativeImport(shell, specifier)),
)
forbidDeclarations(shell, [
  'AddPlaceModal',
  'ClaimAllModal',
  'CoordCard',
  'DelistModal',
  'DisputeModal',
  'EvidenceStack',
  'NationwideConfirmModal',
  'SearchCombobox',
  'SeedSection',
  'useWhereItsSold',
])

requireImports('components/distribution/whereItsSold/CoordCard.tsx', [
  './EvidenceStack',
])
requireImports('components/distribution/whereItsSold/SeedSection.tsx', [
  './CoordCard',
])
requireImports(
  'components/distribution/whereItsSold/modals/AddPlaceModal.tsx',
  ['../SearchCombobox'],
)
requireImports('components/distribution/whereItsSold/useWhereItsSold.ts', [
  '@/lib/distribution/coords',
  '@/lib/distribution/grouping',
  './useDistributionActions',
  './useDistributionData',
])
requireImports(
  'components/distribution/whereItsSold/useDistributionActions.ts',
  ['./useDeclarationActions', './useReviewActions'],
)
for (const modal of [
  'AddPlaceModal',
  'ClaimAllModal',
  'DelistModal',
  'DisputeModal',
  'NationwideConfirmModal',
]) {
  requireImports(
    `components/distribution/whereItsSold/modals/${modal}.tsx`,
    ['./ModalFrame'],
  )
}

const moduleBudgets = {
  [shell]: 350,
  'components/distribution/whereItsSold/useWhereItsSold.ts': 125,
  'components/distribution/whereItsSold/useDistributionData.ts': 125,
  'components/distribution/whereItsSold/useDistributionActions.ts': 175,
  'components/distribution/whereItsSold/useDeclarationActions.ts': 250,
  'components/distribution/whereItsSold/useReviewActions.ts': 225,
  'components/distribution/whereItsSold/CoordCard.tsx': 250,
  'components/distribution/whereItsSold/EvidenceStack.tsx': 150,
  'components/distribution/whereItsSold/SearchCombobox.tsx': 225,
  'components/distribution/whereItsSold/SeedSection.tsx': 175,
  'components/distribution/whereItsSold/types.ts': 100,
  'components/distribution/whereItsSold/modals/AddPlaceModal.tsx': 350,
  'components/distribution/whereItsSold/modals/ClaimAllModal.tsx': 125,
  'components/distribution/whereItsSold/modals/DelistModal.tsx': 125,
  'components/distribution/whereItsSold/modals/DisputeModal.tsx': 125,
  'components/distribution/whereItsSold/modals/ModalFrame.tsx': 125,
  'components/distribution/whereItsSold/modals/NationwideConfirmModal.tsx': 125,
}

const internalDependencies = {
  'components/distribution/whereItsSold/types.ts': [],
  'components/distribution/whereItsSold/SearchCombobox.tsx': [],
  'components/distribution/whereItsSold/EvidenceStack.tsx': [],
  'components/distribution/whereItsSold/CoordCard.tsx': [
    'components/distribution/whereItsSold/EvidenceStack.tsx',
    'components/distribution/whereItsSold/types.ts',
  ],
  'components/distribution/whereItsSold/SeedSection.tsx': [
    'components/distribution/whereItsSold/CoordCard.tsx',
    'components/distribution/whereItsSold/types.ts',
  ],
  'components/distribution/whereItsSold/useDistributionData.ts': [],
  'components/distribution/whereItsSold/useDistributionActions.ts': [
    'components/distribution/whereItsSold/types.ts',
    'components/distribution/whereItsSold/useDeclarationActions.ts',
    'components/distribution/whereItsSold/useReviewActions.ts',
  ],
  'components/distribution/whereItsSold/useDeclarationActions.ts': [
    'components/distribution/whereItsSold/types.ts',
  ],
  'components/distribution/whereItsSold/useReviewActions.ts': [
    'components/distribution/whereItsSold/types.ts',
  ],
  'components/distribution/whereItsSold/useWhereItsSold.ts': [
    'components/distribution/whereItsSold/useDistributionActions.ts',
    'components/distribution/whereItsSold/useDistributionData.ts',
  ],
  'components/distribution/whereItsSold/modals/AddPlaceModal.tsx': [
    'components/distribution/whereItsSold/SearchCombobox.tsx',
    'components/distribution/whereItsSold/types.ts',
    'components/distribution/whereItsSold/modals/ModalFrame.tsx',
  ],
  'components/distribution/whereItsSold/modals/ClaimAllModal.tsx': [
    'components/distribution/whereItsSold/modals/ModalFrame.tsx',
  ],
  'components/distribution/whereItsSold/modals/DelistModal.tsx': [
    'components/distribution/whereItsSold/modals/ModalFrame.tsx',
  ],
  'components/distribution/whereItsSold/modals/DisputeModal.tsx': [
    'components/distribution/whereItsSold/modals/ModalFrame.tsx',
  ],
  'components/distribution/whereItsSold/modals/ModalFrame.tsx': [],
  'components/distribution/whereItsSold/modals/NationwideConfirmModal.tsx': [
    'components/distribution/whereItsSold/types.ts',
    'components/distribution/whereItsSold/modals/ModalFrame.tsx',
  ],
}

const moduleDirectory = path.join(
  root,
  'components/distribution/whereItsSold',
)
const discoveredModules = fs
  .readdirSync(moduleDirectory, { recursive: true })
  .map((entry) =>
    path.posix.join(
      'components/distribution/whereItsSold',
      String(entry).replaceAll(path.sep, '/'),
    ),
  )
  .filter(
    (entry) =>
      !entry.includes('/__tests__/') &&
      (entry.endsWith('.ts') || entry.endsWith('.tsx')),
  )
for (const relativePath of discoveredModules) {
  if (!(relativePath in internalDependencies)) {
    fail(`distribution module is missing from the dependency contract: ${relativePath}`)
  }
}

for (const [relativePath, limit] of Object.entries(moduleBudgets)) {
  enforceLineBudget(relativePath, limit)
}
for (const [relativePath, dependencies] of Object.entries(
  internalDependencies,
)) {
  enforceAllowedInternalImports(relativePath, dependencies)
}
enforceAcyclicGraph([shell, ...Object.keys(internalDependencies)])

if (failed) process.exit(1)
console.log('check-distribution-module-boundaries: ok')
