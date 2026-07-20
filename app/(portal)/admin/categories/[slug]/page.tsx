import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { aggregateCategoryProducts } from '@/lib/categoryIntelligence'
import CategoryIntelligenceClient from './CategoryIntelligenceClient'

interface Props {
  params: Promise<{ slug: string }>
}

type L3BreakdownRow = {
  l3_name: string
  taxonomy_node_id: number
  total_products: number
  products_battled: number
  total_battles: number
  top_elo: number | null
  avg_win_rate: number | null
}

export default async function CategoryIntelligencePage({ params }: Props) {
  const { slug } = await params
  const categoryName = decodeURIComponent(slug)

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') redirect('/dashboard')

  const [{ data: l2Products, error: l2Error }, { data: l3Breakdown, error: breakdownError }] =
    await Promise.all([
      supabase.rpc('get_category_intelligence', { p_l2_name: categoryName }),
      supabase.rpc('get_category_l3_breakdown', { p_l2_name: categoryName }),
    ])

  let products = aggregateCategoryProducts(
    (l2Products ?? []) as Parameters<typeof aggregateCategoryProducts>[0]
  )
  const l2Name = categoryName
  let scopeNote: string | null = null
  let loadError: string | null = null

  if (l2Error) {
    console.error('[category-intelligence] get_category_intelligence', l2Error)
    loadError = l2Error.message
  }
  if (breakdownError) {
    console.error('[category-intelligence] get_category_l3_breakdown', breakdownError)
  }

  // Heat-map slug is labeled L2, but some taxonomy names live as L3. Fall back so the
  // Products → category click still lands on a ranked product list.
  if (products.length === 0) {
    const { data: l3Products, error: l3Error } = await supabase.rpc(
      'get_l3_category_intelligence',
      { p_l3_name: categoryName }
    )
    if (l3Error) {
      console.error('[category-intelligence] get_l3_category_intelligence', l3Error)
      loadError = loadError ?? l3Error.message
    } else if (l3Products && l3Products.length > 0) {
      products = aggregateCategoryProducts(
        (l3Products as Array<Record<string, unknown>>).map((r) => ({
          product_id: Number(r.product_id),
          product_name_clean: String(r.product_name_clean),
          brand_id: Number(r.brand_id),
          brand_name: String(r.brand_name),
          l3_name: categoryName,
          battles_total: Number(r.battles_total),
          battles_won: Number(r.battles_won),
          win_rate_pct: r.win_rate_pct != null ? Number(r.win_rate_pct) : null,
          elo_score: r.elo_score != null ? Number(r.elo_score) : null,
          price_tier_label: (r.price_tier_label as string | null) ?? null,
          image_url: (r.image_url as string | null) ?? null,
        }))
      )
      scopeNote = `Matched as L3 “${categoryName}” — ranked by consumer preference Elo.`
    }
  }

  return (
    <CategoryIntelligenceClient
      l2Name={l2Name}
      products={products}
      l3Breakdown={(l3Breakdown ?? []) as L3BreakdownRow[]}
      scopeNote={scopeNote}
      loadError={loadError}
    />
  )
}
