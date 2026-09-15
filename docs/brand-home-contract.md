# Brand portal Home / chrome contract (2026-09-15 control plane)
#
# Cold-clock owner: public.brand_home_catalog_stats (one row per brand_id).
#   NOT brand_intelligence_snapshots — those own ELO/momentum narrative inputs.
#
# PRODUCER: dirty-only. Writers call mark_brand_home_catalog_dirty(brand_id).
#   refresh_brand_home_catalog_stats drains needs_refresh (plus 24h safety net
#   for has_portal_access brands). Explicit needs_refresh drains for ANY active
#   brand (impersonation targets without portal access).
#   Home snapshot calls ensure_effective_brand_home_catalog_row() (not layout
#   chrome). Returns whether a row was newly inserted; best-effort refresh(1)
#   within 8s on insert — no hardcoded brand ids. Large catalogs that time out
#   stay dirty; live fallback remains honest until cron drains.
#   NEVER "everyone older than 15 minutes". Lag SLO: dirty p95 < 10 min;
#   alert if backlog > 500 or oldest dirty > 30 min.
#
# Health v1: products columns + confident allergen rows; images = image_url OR
#   usable pack-shot role (front/lifestyle/side/other).
#
# Chrome RPC: get_brand_portal_chrome() — layout only. claimed_sku_count =
#   subscription claims; catalog_product_count = active products (live when
#   cold dirty). Never hydrates claimed_product_ids[].
# Home RPC:   get_brand_home_snapshot() — /dashboard brand shell only.
#   Complete UI document: chrome + cold pulse/health/cards/categories + hot
#   studies/domain/ownership + brand profile stub + intel narrative inputs.
# Layout must NEVER call get_brand_home_snapshot.
#
# Clocks:
#   Cold (stats row): product_count, battled_count, total_battles, health,
#     category_count, categories_top, gaining_count, signal_cards, l2_node_ids
#   Hot (request): open_studies, study highlight, domain_verified,
#     pending_ownership, parent_display_name, brand stub, intel stub
#   Fallback (request, when cold dirty / missing / lying zeros): live COUNT
#     pulse + health for this brand only. Never present default 0 as truth.
#     catalog_ready=false in that case. Forbidden still: product GROUP BY for
#     signal_cards / categories_top on the request path.#
# Flags (portal): DOUGH_BRAND_HOME_SNAPSHOT=on|off
#   on  → get_brand_home_snapshot (default)
#   off → fail closed (unavailable UI). Legacy fan-out deleted.
# Two-repo: dough migrate → verify → portal cutover → delete fan-out.
#
# Payload cap: brand home snapshot < 24KB (oracle).
# Budgets: brand.home.snapshot p95 < 150ms; brand.chrome p95 < 50ms.

## get_brand_portal_chrome() jsonb
# {
#   "brand_id": 1,
#   "brand_name": "Acme",
#   "claimed_sku_count": 0,
#   "catalog_product_count": 0,
#   "plan": "founder" | null
# }

## get_brand_home_snapshot() jsonb
# {
#   "generated_at": "...",
#   "catalog_refreshed_at": "..." | null,
#   "chrome": { ...same as chrome RPC... },
#   "brand": {
#     "brand_id", "brand_name", "brand_name_display", "brand_website_url",
#     "has_portal_access", "logo_url", "about_text", "brand_story",
#     "headquarters_city", "headquarters_state", "brand_hq_country_code",
#     "founded_year", "instagram_handle", "tiktok_handle", "youtube_handle",
#     "x_handle", "linkedin_url", "sustainability_report_url",
#     "labor_policy_url", "manufacturing_locations"
#   },
#   "intel": {
#     "elo_velocity_30d", "win_rate_30d", "momentum_label",
#     "total_battles_30d", "total_battles_all_time", "compare_group_rank",
#     "top_occasions"
#   } | null,
#   "pulse": {
#     "product_count": 0,
#     "battled_count": 0,
#     "total_battles": 0,
#     "open_studies": 0,          // HOT
#     "gaining_count": 0,         // COLD
#     "domain_verified": false,   // HOT
#     "category_count": 0         // COLD
#   },
#   "catalog_health": {
#     "total": 0,
#     "categories": {"have":0,"total":0},
#     "images": {"have":0,"total":0},
#     "pricing": {"have":0,"total":0},
#     "label_allergen": {"have":0,"total":0}
#   },
#   "signal_cards": [ {
#     "product_id", "name", "category", "image_url", "comparison_events",
#     "standing_unlocked", "standing_rank_label", "standing_tooltip"
#   } ],  // ≤5, COLD; pack-shot + standing for those ids only
#   "categories_top": [ {
#     "l2_node_id", "name", "products_with_battles", "unlocked", "banner_image_url"
#   } ], // ≤4, COLD
#   "l2_node_ids": [1,2,3],  // COLD — Reports relevance; not a product scan
#   "studies": {
#     "open_count": 0,
#     "highlight": { "id", "title", "kind", "detail", "mission_type", "lifecycle_state",
#                    "completed_claims", "total_claims", "target_completions" } | null
#   },
#   "parent_display_name": null,
#   "pending_ownership": false
# }
