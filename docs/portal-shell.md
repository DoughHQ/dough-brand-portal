# Portal shell — page canvas contract
#
# Desktop shell: fixed sidebar + `.portal-main` clears it with margin-left.
# `.portal-main` is a column flex container. Every page root is a flex child.
#
# RULES
# 1. Page roots fill the main column: width 100%, min-width 0, stretch.
# 2. NEVER put `container-type` / size containment on a page root
#    (`.cat-page`, `.bh-page`, `.pm-page`, `.reports-page`, …).
#    WebKit collapses that flex item to min-content (~one word wide), then
#    `@container (max-width: 559px)` falsely fires on desktop.
# 3. If you need container queries, put them on an INNER wrapper
#    (e.g. `.cat-page-cq` via `<CatPage>`).
# 4. Do not center a capped max-width island inside main; pad the canvas.
#
# Catalog canvas: always use `<CatPage>` from `components/categories/CatPage.tsx`
# — never `<div className="cat-page">`.
#
# CI: `npm run check:page-root-containment-ban`
# Skeletons: see `docs/portal-skeletons.md`
