# Portal shell — page canvas contract
#
# Desktop shell: fixed sidebar (220px) + `.portal-main` clears it with margin-left.
# `.portal-main` width is viewport-definite: `calc(100vw - var(--portal-sidebar-w))`.
# Do not size main as a % of a flex ancestor — Safari has collapsed that chain
# after font swap / client reflow (~1–2s after first paint).
#
# RULES
# 1. Page roots fill the main column: width 100%, min-width 0, max-width none.
# 2. NEVER use size containment or container queries on portal page canvases
#    (`.cat-page`, `.cat-page-cq`, `.bh-page`, `.pm-page`, `.reports-page`, …).
# 3. Responsive layout uses viewport media queries. Compact shell (≤880px)
#    sets `--portal-sidebar-w: 0` and shows the topbar/drawer.
# 4. Do not center a capped max-width island inside main; pad the canvas.
# 5. Sidebar inset: padding lives on `.portal-aside` itself (globals reset * padding).
#
# Catalog canvas: always use `<CatPage>` (client) — it self-heals if WebKit
# shrinks the canvas below ~35% of main after paint.
#
# CI: `npm run check:page-root-containment-ban`
# Skeletons: see `docs/portal-skeletons.md`
