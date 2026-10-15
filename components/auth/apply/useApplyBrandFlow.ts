import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  isValidBrandWebsite,
  isValidWorkEmail,
  normalizeBrandWebsite,
  normalizeLinkedInInput,
  normalizeRoleTitle,
  parseBrandSearchHits,
  type ApplicationBrandHit,
} from '@/lib/brandApplicationFlow'
import { safeLinkedInHref } from '@/lib/brandApplications'
import {
  APPLY_WHILE_AUTH_COPY,
  applyWaitlistInsertErrorCopy,
} from '@/lib/auth/authErrorCopy'
import type { Props } from './applyModel'

export type ApplyBrandFlowState = ReturnType<typeof useApplyBrandFlow>

export function useApplyBrandFlow({
  setStep,
  setError,
}: Pick<Props, 'setStep' | 'setError'>) {
  const searchReqId = useRef(0)

  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<ApplicationBrandHit[]>([])
  const [searching, setSearching] = useState(false)
  const [searchTried, setSearchTried] = useState(false)

  const [selectedBrand, setSelectedBrand] = useState<ApplicationBrandHit | null>(null)
  const [typedBrandName, setTypedBrandName] = useState('')

  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [brandWebsite, setBrandWebsite] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return
      setSignedInEmail(session?.user?.email ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setHits([])
      setSearching(false)
      setSearchTried(false)
      return
    }

    const id = ++searchReqId.current
    setSearching(true)
    const t = window.setTimeout(() => {
      void (async () => {
        const supabase = createClient()
        try {
          const { data, error: rpcError } = await supabase.rpc('search_brands_for_application', {
            p_query: q,
          })
          if (id !== searchReqId.current) return
          if (rpcError) {
            setHits([])
            setError('Couldn’t search brands. Try again.')
          } else {
            setError(null)
            setHits(parseBrandSearchHits(data))
          }
          setSearchTried(true)
        } catch {
          if (id !== searchReqId.current) return
          setHits([])
          setError('Couldn’t search brands. Try again.')
          setSearchTried(true)
        } finally {
          if (id === searchReqId.current) setSearching(false)
        }
      })()
    }, 300)

    return () => window.clearTimeout(t)
  }, [query, setError])

  function selectBrand(hit: ApplicationBrandHit) {
    setSelectedBrand(hit)
    setTypedBrandName(hit.brand_name)
    setError(null)
    setStep('details')
  }

  function chooseNetNew() {
    setSelectedBrand(null)
    setTypedBrandName(query.trim())
    setError(null)
    setStep('details')
  }

  async function handleSignOut() {
    setSigningOut(true)
    setError(null)
    const supabase = createClient()
    await supabase.auth.signOut({ scope: 'local' })
    setSignedInEmail(null)
    setSigningOut(false)
  }

  async function handleSubmit() {
    if (signedInEmail) {
      setError(APPLY_WHILE_AUTH_COPY)
      return
    }
    const brandName = (selectedBrand?.brand_name ?? typedBrandName).trim()
    if (!brandName) {
      setError('Brand name is required.')
      return
    }
    if (!contactName.trim() || !contactEmail.trim()) {
      setError('Your name and work email are required.')
      return
    }
    if (!isValidWorkEmail(contactEmail)) {
      setError('Enter a valid work email.')
      return
    }
    if (linkedinUrl.trim() && !safeLinkedInHref(linkedinUrl)) {
      setError('LinkedIn should be a normal web link (linkedin.com/…).')
      return
    }
    const websiteRequired = selectedBrand == null
    if (websiteRequired && !brandWebsite.trim()) {
      setError('Brand website is required when your brand isn’t in the catalog yet.')
      return
    }
    if (!isValidBrandWebsite(brandWebsite)) {
      setError('Enter a normal website (yourbrand.com).')
      return
    }

    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    // Anon RLS rejects booking_scheduled_at / booking_ref / invited_at / non-pending status.
    // Do not send those fields or primary_category.
    const { error: insertError } = await supabase.from('brand_waitlist').insert({
      brand_name: brandName.slice(0, 200),
      contact_name: contactName.trim().slice(0, 200),
      contact_email: contactEmail.trim().toLowerCase(),
      brand_id: selectedBrand?.brand_id ?? null,
      role_title: normalizeRoleTitle(roleTitle),
      linkedin_url: normalizeLinkedInInput(linkedinUrl),
      brand_website: normalizeBrandWebsite(brandWebsite),
      flagged_not_mine_product_ids: [],
    })

    setSubmitting(false)
    if (insertError) {
      // One pending request per email — show the same confirmation; reveals nothing.
      if (insertError.code === '23505') {
        setStep('booking')
        return
      }
      const authCopy = applyWaitlistInsertErrorCopy(insertError)
      if (authCopy) {
        setError(authCopy)
        return
      }
      console.error('brand_waitlist insert', insertError)
      setError('Something went wrong. Please try again.')
      return
    }
    setStep('booking')
  }

  return {
    query,
    setQuery,
    hits,
    searching,
    searchTried,
    selectedBrand,
    typedBrandName,
    setTypedBrandName,
    contactName,
    setContactName,
    contactEmail,
    setContactEmail,
    roleTitle,
    setRoleTitle,
    linkedinUrl,
    setLinkedinUrl,
    brandWebsite,
    setBrandWebsite,
    submitting,
    signedInEmail,
    signingOut,
    selectBrand,
    chooseNetNew,
    handleSignOut,
    handleSubmit,
  }
}
