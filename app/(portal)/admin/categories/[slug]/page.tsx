import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import {
  aggregateCategoryProducts,
  isRealRpcError,
  logRpcError,
  matchL2DisplayName,
} from '@/lib/categoryIntelligence'
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

async function resolveL2DisplayName(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  slug: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('taxonomy_nodes')
    .select('node_name_display')
    .eq('node_level', 2)
    .eq('status', 'active')

  if (error || !data?.length) {
    // Fall back: treat decoded slug as display name (legacy encodeURIComponent links)
    try {
      const decoded = decodeURIComponent(slug).trim()
      return decoded || null
    } catch {
      return slug.trim() || null
    }
  }

  const names = data.map((r) => String(r.node_name_display ?? '')).filter(Boolean)
  return matchL2DisplayName(names, slug)
}

export default async function CategoryIntelligencePage({ params }: Props) {
  const { slug } = await params

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') redirect('/dashboard')

  const l2Name = await resolveL2DisplayName(supabase, slug)

  if (!l2Name) {
    return (
      <CategoryIntelligenceClient
        l2Name={slug}
        products={[]}
        l3Breakdown={[]}
        scopeNote={null}
        loadError={null}
        emptyMessage="No data for this category yet"
      />
    )
  }

  const [{ data: l2Products, error: l2Error }, { data: l3Breakdown, error: breakdownError }] =
    await Promise.all([
      supabase.rpc('get_category_intelligence', { p_l2_name: l2Name }),
      supabase.rpc('get_category_l3_breakdown', { p_l2_name: l2Name }),
    ])

  let products = aggregateCategoryProducts(
    (l2Products ?? []) as Parameters<typeof aggregateCategoryProducts>[0]
  )
  let scopeNote: string | null = null
  let loadError: string | null = null

  if (isRealRpcError(l2Error)) {
    logRpcError('[category-intelligence] get_category_intelligence', l2Error)
    loadError = l2Error.message
  }
  if (isRealRpcError(breakdownError)) {
    logRpcError('[category-intelligence] get_category_l3_breakdown', breakdownError)
  }

  // Heat-map slug is labeled L2, but some taxonomy names live as L3. Fall back so the
  // Products → category click still lands on a ranked product list.
  if (products.length === 0 && !loadError) {
    const { data: l3Products, error: l3Error } = await supabase.rpc(
      'get_l3_category_intelligence',
      { p_l3_name: l2Name }
    )
    if (isRealRpcError(l3Error)) {
      logRpcError('[category-intelligence] get_l3_category_intelligence', l3Error)
      loadError = l3Error.message
    } else if (l3Products && l3Products.length > 0) {
      products = aggregateCategoryProducts(
        (l3Products as Array<Record<string, unknown>>).map((r) => ({
          product_id: Number(r.product_id),
          product_name_clean: String(r.product_name_clean),
          brand_id: Number(r.brand_id),
          brand_name: String(r.brand_name),
          l3_name: l2Name,
          battles_total: Number(r.battles_total),
          battles_won: Number(r.battles_won),
          win_rate_pct: r.win_rate_pct != null ? Number(r.win_rate_pct) : null,
          elo_score: r.elo_score != null ? Number(r.elo_score) : null,
          price_tier_label: (r.price_tier_label as string | null) ?? null,
          image_url: (r.image_url as string | null) ?? null,
        }))
      )
      scopeNote = `Matched as L3 “${l2Name}” — ranked by consumer preference Elo.`
    }
  }

  return (
    <CategoryIntelligenceClient
      l2Name={l2Name}
      products={products}
      l3Breakdown={(l3Breakdown ?? []) as L3BreakdownRow[]}
      scopeNote={scopeNote}
      loadError={loadError}
      emptyMessage="No data for this category yet"
    />
  )
}
