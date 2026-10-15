'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import type { BrandHomeModel } from '@/lib/brandHome/selectHomeModel'
import type { ProductSignalCardModel } from '@/lib/brandHome/productSignalCards'
import type { OnboardingChecklistInput } from '@/lib/brandHome/onboardingChecklist'
import WhatChangedStrip from '@/components/brandHome/WhatChangedStrip'
import { buildHomeAttention } from '@/lib/brandHome/homeAttention'
import type { CatalogHealth } from '@/lib/brandHome/catalogHealth'
import OnboardingChecklistCard from '@/components/brandHome/OnboardingChecklist'
import './brandHome.css'
import { AttentionPanel } from './home/AttentionPanel'
import { CategoriesSection } from './home/CategoriesSection'
import { HomeAside } from './home/HomeAside'
import { buildHomeStrip } from './home/homeStrip'
import { OpenStudiesSection } from './home/OpenStudiesSection'
import { ProductsSection } from './home/ProductsSection'
import { SnapshotStrip } from './home/SnapshotStrip'

export default function BrandHome({
  model,
  profileSlot,
  totalProductCount = 0,
  totalBattles = 0,
  signalCards = [],
  catalogHealth,
  domainVerified = false,
  brandId,
  onboardingChecklist = null,
  welcome = false,
}: {
  model: BrandHomeModel
  profileSlot?: ReactNode
  totalProductCount?: number
  totalBattles?: number
  signalCards?: ProductSignalCardModel[]
  catalogHealth?: CatalogHealth
  domainVerified?: boolean
  brandId?: number
  onboardingChecklist?: OnboardingChecklistInput | null
  welcome?: boolean
}) {
  const attention = buildHomeAttention({ model, catalogHealth })
  const strip = buildHomeStrip({ model, totalProductCount, totalBattles })

  return (
    <div className="bh-page">
      {onboardingChecklist ? (
        <OnboardingChecklistCard input={onboardingChecklist} welcome={welcome} />
      ) : null}
      <header className="bh-top">
        <div className="bh-top-main">{profileSlot}</div>
        <Link href="/studies/new" className="portal-btn portal-btn-cta bh-new-study">
          <span aria-hidden>+</span> New study
        </Link>
      </header>

      {attention.length > 0 ? (
        <AttentionPanel attention={attention} />
      ) : null}

      {brandId != null && brandId > 0 ? (
        <WhatChangedStrip brandId={brandId} model={model} />
      ) : null}

      <SnapshotStrip strip={strip} />

      <div className="bh-grid">
        <div className="bh-col bh-col-main">
          <OpenStudiesSection model={model} />

          <ProductsSection totalProductCount={totalProductCount} signalCards={signalCards} />

          <CategoriesSection model={model} />
        </div>

        <HomeAside model={model} catalogHealth={catalogHealth} domainVerified={domainVerified} />
      </div>
    </div>
  )
}
