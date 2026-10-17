/**
 * First-load JavaScript budgets per app route, read from a finished build.
 *
 * Run after `npm run build`. A route's first load is the shared framework
 * chunks, the chunk groups of the layouts above it, and its own page chunk
 * group, each chunk counted once and measured gzipped. Next 16 no longer
 * prints these sizes, so they come from the client reference manifests.
 *
 * scripts/bundle-budgets.json lists every route. A new route needs an entry,
 * and a removed route must lose its entry. Raise a budget in the same change
 * that grows the route, and say why in the PR.
 *
 * `--report` prints sizes without failing.
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const nextDir = path.join(root, '.next')
const report = process.argv.includes('--report')

if (!fs.existsSync(path.join(nextDir, 'build-manifest.json'))) {
  console.error('BUDGET FAIL: no build found. Run `npm run build` first.')
  process.exit(1)
}

const { routes: budgets } = JSON.parse(
  fs.readFileSync(path.join(root, 'scripts/bundle-budgets.json'), 'utf8'),
)

const gzipSizes = new Map()
function gzipSize(chunk) {
  if (!gzipSizes.has(chunk)) {
    const source = fs.readFileSync(path.join(nextDir, decodeURIComponent(chunk)))
    gzipSizes.set(chunk, zlib.gzipSync(source).length)
  }
  return gzipSizes.get(chunk)
}

function clientManifests(dir) {
  const found = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) found.push(...clientManifests(entryPath))
    else if (entry.name === 'page_client-reference-manifest.js') found.push(entryPath)
  }
  return found
}

function readManifest(file) {
  const scope = {}
  new Function('globalThis', 'self', fs.readFileSync(file, 'utf8'))(scope, scope)
  return Object.entries(scope.__RSC_MANIFEST)[0]
}

const encodeSegments = (route) => route.replace(/\[/g, '%5B').replace(/\]/g, '%5D')
const jsChunks = (mod) =>
  (mod.chunks ?? []).filter((chunk) => typeof chunk === 'string' && chunk.endsWith('.js'))

const build = JSON.parse(fs.readFileSync(path.join(nextDir, 'build-manifest.json'), 'utf8'))
const shared = [...build.rootMainFiles, ...build.polyfillFiles]

const layoutChunks = new Map()
const pageChunks = new Map()
for (const file of clientManifests(path.join(nextDir, 'server/app'))) {
  const [key, manifest] = readManifest(file)
  const route = key.replace(/\/page$/, '') || '/'
  const pagePrefix = `static/chunks/app${encodeSegments(key)}-`
  const chunks = new Set()
  for (const mod of Object.values(manifest.clientModules)) {
    const group = jsChunks(mod)
    if (group.some((chunk) => chunk.startsWith(pagePrefix))) group.forEach((c) => chunks.add(c))
    const layout = group.find((chunk) => /\/layout-[0-9a-f]+\.js$/.test(chunk))
    if (layout) {
      const segment = decodeURIComponent(
        layout.replace(/^static\/chunks\/app/, '').replace(/\/layout-[0-9a-f]+\.js$/, ''),
      )
      const set = layoutChunks.get(segment) ?? new Set()
      group.forEach((c) => set.add(c))
      layoutChunks.set(segment, set)
    }
  }
  pageChunks.set(route, chunks)
}

const sizes = new Map()
for (const [route, chunks] of pageChunks) {
  const firstLoad = new Set(shared)
  for (const [segment, set] of layoutChunks) {
    if (segment === '' || route === segment || route.startsWith(`${segment}/`)) {
      set.forEach((c) => firstLoad.add(c))
    }
  }
  chunks.forEach((c) => firstLoad.add(c))
  const bytes = [...firstLoad].reduce((total, chunk) => total + gzipSize(chunk), 0)
  sizes.set(route, Math.round((bytes / 1024) * 10) / 10)
}

let failed = false
function fail(message) {
  console.error(`BUDGET FAIL: ${message}`)
  failed = true
}

const routes = [...sizes.keys()].sort()
for (const route of routes) {
  const size = sizes.get(route)
  const budget = budgets[route]
  if (report) console.log(`${size.toFixed(1).padStart(7)} kB  ${String(budget ?? '-').padStart(4)}  ${route}`)
  if (budget == null) fail(`${route} has no budget (${size} kB first load)`)
  else if (size > budget) fail(`${route} first load is ${size} kB, over its ${budget} kB budget`)
}
for (const route of Object.keys(budgets)) {
  if (!sizes.has(route)) fail(`budget lists ${route}, which the build no longer has`)
}

if (report) process.exit(0)
if (failed) process.exit(1)
console.log(`check-bundle-budgets: ok (${routes.length} routes)`)
