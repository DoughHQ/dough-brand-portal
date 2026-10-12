import { supportHref } from '@/lib/productMaster/support'

export type OnboardingChecklistInput = {
  brandName: string
  logoUrl: string | null | undefined
  websiteUrl: string | null | undefined
  aboutText: string | null | undefined
  productCount: number
  prototypeCount: number
  openStudies: number
  draftCount: number
}

export type OnboardingChecklistLink = {
  label: string
  href: string
}

export type OnboardingChecklistStep = {
  id: 'profile' | 'product' | 'study'
  title: string
  done: boolean
  links: OnboardingChecklistLink[]
}

export type OnboardingChecklist = {
  steps: OnboardingChecklistStep[]
  allDone: boolean
}

function nonBlank(value: string | null | undefined): boolean {
  return (value ?? '').trim().length > 0
}

/**
 * Pure welcome checklist for first-run Home.
 * Profile editor lives on `/dashboard` (BrandProfileCard).
 */
export function deriveOnboardingChecklist(
  input: OnboardingChecklistInput
): OnboardingChecklist {
  const brandName = input.brandName.trim() || 'your brand'
  const profileDone =
    nonBlank(input.logoUrl) && nonBlank(input.websiteUrl) && nonBlank(input.aboutText)
  const productDone = input.productCount > 0 || input.prototypeCount > 0
  const studyDone = input.openStudies > 0 || input.draftCount > 0

  const productLinks: OnboardingChecklistLink[] =
    input.productCount > 0
      ? [
          {
            label: 'Your products are in the catalog. Check your product page',
            href: '/products',
          },
        ]
      : [
          {
            label: 'Not on shelves yet? Add it as a prototype',
            href: '/prototypes',
          },
          {
            label: 'Already on shelves? Send us the barcode',
            href: supportHref(`Add my product: ${brandName}`),
          },
        ]

  const steps: OnboardingChecklistStep[] = [
    {
      id: 'profile',
      title: 'Complete your brand profile',
      done: profileDone,
      links: [{ label: 'Edit brand profile', href: '/dashboard' }],
    },
    {
      id: 'product',
      title:
        input.productCount > 0
          ? 'Your products are in the catalog'
          : 'Add your first product',
      done: productDone,
      links: productLinks,
    },
    {
      id: 'study',
      title: 'Set up your first study',
      done: studyDone,
      links: [{ label: 'Set up your first study', href: '/studies/new' }],
    },
  ]

  return {
    steps,
    allDone: profileDone && productDone && studyDone,
  }
}
