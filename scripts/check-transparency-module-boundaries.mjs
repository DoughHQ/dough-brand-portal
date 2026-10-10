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

function sourceFile(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) {
    fail(`missing module boundary file: ${relativePath}`)
    return null
  }
  return ts.createSourceFile(
    relativePath,
    fs.readFileSync(absolutePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    relativePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
}

function moduleImports(file) {
  const imports = new Set()
  for (const statement of file?.statements ?? []) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      imports.add(statement.moduleSpecifier.text)
    }
  }
  return imports
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

requireImports('components/transparency/ProductTransparencyStudio.tsx', [
  '@/components/transparency/studio/InventoryGroups',
  '@/components/transparency/studio/progress',
  '@/components/transparency/studio/types',
  '@/components/transparency/studio/useTransparencyStudio',
])
requireImports('components/transparency/studio/InventoryGroups.tsx', [
  './DisclosureRowEditor',
])
forbidDeclarations('components/transparency/ProductTransparencyStudio.tsx', [
  'DisclosureRowEditor',
  'InventoryGroups',
  'useTransparencyStudio',
])

requireImports('components/transparency/OperationsSheet.tsx', [
  '@/components/transparency/operations/AidSheet',
  '@/components/transparency/operations/FlavorSheet',
  '@/components/transparency/operations/MadeKeptEditor',
  '@/components/transparency/operations/RefinementSheet',
  '@/components/transparency/operations/WholeEnumCard',
])
requireImports('components/transparency/operations/RefinementSheet.tsx', [
  '@/components/transparency/operations/SubjectEnumEditor',
])
requireImports('components/transparency/operations/FlavorSheet.tsx', [
  '@/components/transparency/operations/SubjectTextEditor',
])
requireImports('components/transparency/operations/AidSheet.tsx', [
  '@/components/transparency/operations/SubjectTextEditor',
])

requireImports('components/transparency/RightsSheet.tsx', [
  './rights/DiligenceEditor',
  './rights/LaborEditor',
  './rights/LivingEditor',
  './rights/SingleEnumCard',
  './rights/SingleTextCard',
  './rights/SupplierEditor',
])
for (const editor of [
  'DiligenceEditor',
  'LaborEditor',
  'LivingEditor',
  'SingleEnumCard',
  'SingleTextCard',
  'SupplierEditor',
]) {
  requireImports(`components/transparency/rights/${editor}.tsx`, [
    './ProvenanceFields',
  ])
}
forbidDeclarations('components/transparency/RightsSheet.tsx', [
  'DiligenceEditor',
  'LaborEditor',
  'LivingEditor',
  'ProvenanceFields',
  'SingleEnumCard',
  'SingleTextCard',
  'SupplierEditor',
])

if (failed) process.exit(1)
console.log('check-transparency-module-boundaries: ok')
