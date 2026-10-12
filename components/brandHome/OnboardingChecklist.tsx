'use client'

import { useState, useTransition, type ReactNode } from 'react'
import Link from 'next/link'
import {
  deriveOnboardingChecklist,
  type OnboardingChecklistInput,
} from '@/lib/brandHome/onboardingChecklist'
import { completeBrandOnboardingAction } from '@/app/(portal)/dashboard/onboardingActions'
import { PRODUCT_NAME } from '@/lib/brand'
import './brandHome.css'

type Props = {
  input: OnboardingChecklistInput
  welcome?: boolean
}

export default function OnboardingChecklistCard({ input, welcome = false }: Props) {
  const checklist = deriveOnboardingChecklist(input)
  const [hidden, setHidden] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (hidden) return null

  function finish() {
    setError(null)
    startTransition(async () => {
      const res = await completeBrandOnboardingAction()
      if (!res.ok) {
        setError("Couldn't save that. Try again.")
        return
      }
      setHidden(true)
    })
  }

  const heading = welcome
    ? `Welcome to ${PRODUCT_NAME}, ${input.brandName.trim() || 'partner'}`
    : 'Get set up'

  return (
    <section className="bh-onboarding portal-panel" aria-label="Welcome checklist">
      <div className="bh-onboarding-head">
        <div>
          <p className="bh-ops-eyebrow">{welcome ? 'Welcome' : 'Getting started'}</p>
          <h2 className="bh-onboarding-title">{heading}</h2>
        </div>
        <button
          type="button"
          className="bh-onboarding-hide"
          onClick={finish}
          disabled={pending}
        >
          Hide this
        </button>
      </div>

      <ol className="bh-onboarding-list">
        {checklist.steps.map((step) => (
          <li
            key={step.id}
            className={`bh-onboarding-step${step.done ? ' is-done' : ''}`}
          >
            <span className="bh-onboarding-mark" aria-hidden>
              {step.done ? '✓' : '○'}
            </span>
            <div className="bh-onboarding-body">
              <p className="bh-onboarding-step-title">{step.title}</p>
              {!step.done ? (
                <div className="bh-onboarding-links">
                  {step.links.map((link) =>
                    link.href.startsWith('mailto:') ? (
                      <a key={link.href + link.label} href={link.href} className="bh-link">
                        {link.label}
                      </a>
                    ) : (
                      <Link key={link.href + link.label} href={link.href} className="bh-link">
                        {emphasizeAction(link.label)}
                      </Link>
                    )
                  )}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {checklist.allDone ? (
        <div className="bh-onboarding-finish">
          <p className="bh-onboarding-ready">You&apos;re all set</p>
          <button
            type="button"
            className="portal-btn portal-btn-cta"
            onClick={finish}
            disabled={pending}
          >
            {pending ? 'Saving…' : 'Finish setup'}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="bh-onboarding-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}

/** Bold the action clause after the last sentence break / question. */
function emphasizeAction(label: string): ReactNode {
  const idx = Math.max(label.lastIndexOf('? '), label.lastIndexOf('. '))
  if (idx < 0) return <strong>{label}</strong>
  const lead = label.slice(0, idx + 2)
  const action = label.slice(idx + 2)
  return (
    <>
      {lead}
      <strong>{action}</strong>
    </>
  )
}
