# Portal shell — page canvas contract
#
# Desktop shell: fixed sidebar (220px) + `.portal-main` clears it with margin-left.
# `.portal-main` is `display: block` (not a flex column). Page roots are normal
# block children at width 100%.
#
# RULES
# 1. Page roots fill the main column: width 100%, min-width 0, max-width none.
# 2. NEVER use size containment or container queries on portal page canvases
#    (`.cat-page`, `.cat-page-cq`, `.bh-page`, `.pm-page`, `.reports-page`, …).
#    WebKit flex + size containment collapses the canvas to min-content
#    (~one word wide). Inner wrappers do NOT make this safe.
# 3. Responsive layout uses viewport media queries. When approximating former
#    canvas-width queries, add the desktop rail (220px). Compact shell
#    (≤880px) sets `--portal-sidebar-w: 0`.
# 4. Do not center a capped max-width island inside main; pad the canvas.
#
# Catalog canvas: always use `<CatPage>` from `components/categories/CatPage.tsx`
# — never `<div className="cat-page">`.
#
# CI: `npm run check:page-root-containment-ban`
# Skeletons: see `docs/portal-skeletons.md`
