'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import type { ProductStudyCard } from '@/lib/productMaster/productHeroStudies'
import './productDetailTabs.css'

export function ProductTabStack({ children }: { children: ReactNode }) {
  return <div className="pm-tab-stack">{children}</div>
}

export function ProductOverviewTab({ children }: { children: ReactNode }) {
  return <div className="pm-overview-grid">{children}</div>
}

export function ProductPackagesTab({ children }: { children: ReactNode }) {
  return <div className="pm-sku-tab">{children}</div>
}

export function ProductPricingTab({ children }: { children: ReactNode }) {
  return <ProductTabStack>{children}</ProductTabStack>
}

export function ProductNutritionTab({ children }: { children: ReactNode }) {
  return <div className="pm-comp-tab">{children}</div>
}

export function ProductIntelligenceTab({ children }: { children: ReactNode }) {
  return <div className="pm-intel-tab">{children}</div>
}

export function ProductImagesTab({ children }: { children: ReactNode }) {
  return <ProductTabStack>{children}</ProductTabStack>
}

export function ProductStudiesTab({ studies }: { studies: ProductStudyCard[] }) {
  if (studies.length === 0) {
    return (
      <div className="pm-studies-tab">
        <div className="pm-studies-empty">
          <div className="pm-studies-empty-icon" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M8.5 4.5h8.2L21.5 9.3V23a.5.5 0 0 1-.5.5H8.5A.5.5 0 0 1 8 23V5a.5.5 0 0 1 .5-.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M16.5 4.5V9h4.8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="16.2" cy="16.6" r="3.3" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M18.6 19 22 22.4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2 className="pm-studies-empty-title">No studies for this product yet</h2>
          <p className="pm-studies-empty-copy">
            Studies connected to this product will appear here. Create a study to gather
            feedback and build real consumer insights.
          </p>
          <Link href="/studies/new" className="pm-studies-empty-cta">
            <span aria-hidden>+</span>
            Create study
          </Link>
          <Link href="/studies" className="pm-studies-empty-learn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M2.5 3.5h5.2c.9 0 1.8.4 2.3 1.1.5-.7 1.4-1.1 2.3-1.1H13.5v9H10.3c-.9 0-1.8.3-2.3 1-.5-.7-1.4-1-2.3-1H2.5v-9Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <path d="M8 4.6v8.2" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            Learn how studies work
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pm-studies-tab">
      <div className="pm-studies-header">
        <div>
          <h2 className="pm-studies-title">Studies</h2>
          <p className="pm-studies-sub">
            {studies.length === 1
              ? '1 study where this product is the hero'
              : `${studies.length} studies where this product is the hero`}
          </p>
        </div>
        <Link href="/studies/new" className="pm-studies-empty-cta">
          <span aria-hidden>+</span>
          Create study
        </Link>
      </div>
      <div className="pm-studies-list">
        {studies.map((study) => (
          <article key={study.missionId} className="pm-studies-card">
            <div className="pm-studies-card-main">
              <div className="pm-studies-card-meta">
                <span className="pm-studies-type">{study.typeLabel}</span>
                <span className="pm-studies-badge">{study.badge}</span>
                {!study.isCampaignOwner ? (
                  <span className="pm-studies-cosponsor">Co-sponsored</span>
                ) : null}
              </div>
              <h3 className="pm-studies-card-title">{study.title}</h3>
              <p className="pm-studies-card-progress">{study.progressDetail}</p>
              {study.progressPct != null ? (
                <div className="pm-studies-bar" aria-hidden>
                  <div className="pm-studies-bar-fill" style={{ width: `${study.progressPct}%` }} />
                </div>
              ) : null}
            </div>
            <Link href={study.href} className="pm-studies-card-cta">
              {study.ctaLabel}
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}

export function ProductProofTab() {
  return (
    <div className="pm-empty-tab">
      <h2>Proof</h2>
      <p>Supporting sustainability, sourcing, certification, and product evidence will live here.</p>
    </div>
  )
}

export function ProductActivityTab() {
  return (
    <div className="pm-empty-tab">
      <h2>Activity</h2>
      <p>Product history will live here.</p>
    </div>
  )
}
