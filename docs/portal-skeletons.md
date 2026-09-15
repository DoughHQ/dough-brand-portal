# Portal skeletons

Layout twins for brand portal routes. Never put skeleton markup in `loading.tsx` —
Next requires that filename; keep it a one-line import.

## Convention

| Page | Component | Route hook |
|---|---|---|
| Home | `components/brandHome/home_skeleton.tsx` | `dashboard/loading.tsx` |
| Products | `components/products/products_skeleton.tsx` | `products/loading.tsx` |
| Product detail | `components/products/product_detail_skeleton.tsx` | `products/[productId]/loading.tsx` |
| Categories | `components/categories/categories_skeleton.tsx` | `categories/loading.tsx` |
| Studies | `components/studies/studies_skeleton.tsx` | `studies/loading.tsx` |
| Reports | `components/reports/reports_skeleton.tsx` | `reports/loading.tsx` |

Shared shimmer: `components/portal/SkeletonBone.tsx` + `skeleton_bones.css`.

Client-side waits (Categories launcher RPC, Reports catalog fetch) reuse the same
component with `embedded` so the chrome/header does not flash twice.

Shell / page-root rules (containment, fill main): see `docs/portal-shell.md`.
