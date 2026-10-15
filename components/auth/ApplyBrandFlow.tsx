'use client'

import '@/components/auth/authShell.css'
import type { Props } from './apply/applyModel'
import { ApplyBookingStep } from './apply/ApplyBookingStep'
import { ApplyDetailsStep } from './apply/ApplyDetailsStep'
import { ApplySearchStep } from './apply/ApplySearchStep'
import { ApplySessionBanner } from './apply/ApplySessionBanner'
import { useApplyBrandFlow } from './apply/useApplyBrandFlow'

export type { ApplyStep } from './apply/applyModel'

export default function ApplyBrandFlow({
  step,
  setStep,
  error,
  setError,
  onGoToLogin,
  styles,
}: Props) {
  const {
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
  } = useApplyBrandFlow({ setStep, setError })

  const sessionBanner =
    signedInEmail && step !== 'booking' ? (
      <ApplySessionBanner
        signedInEmail={signedInEmail}
        signingOut={signingOut}
        handleSignOut={handleSignOut}
      />
    ) : null

  return (
    <div style={styles.cardStyle}>
      {sessionBanner}
      {step === 'search' && (
        <ApplySearchStep
          query={query}
          setQuery={setQuery}
          searching={searching}
          error={error}
          hits={hits}
          selectBrand={selectBrand}
          searchTried={searchTried}
          chooseNetNew={chooseNetNew}
          onGoToLogin={onGoToLogin}
          styles={styles}
        />
      )}

      {step === 'details' && (
        <ApplyDetailsStep
          selectedBrand={selectedBrand}
          typedBrandName={typedBrandName}
          setTypedBrandName={setTypedBrandName}
          contactName={contactName}
          setContactName={setContactName}
          contactEmail={contactEmail}
          setContactEmail={setContactEmail}
          roleTitle={roleTitle}
          setRoleTitle={setRoleTitle}
          linkedinUrl={linkedinUrl}
          setLinkedinUrl={setLinkedinUrl}
          brandWebsite={brandWebsite}
          setBrandWebsite={setBrandWebsite}
          error={error}
          setError={setError}
          submitting={submitting}
          signedInEmail={signedInEmail}
          handleSubmit={handleSubmit}
          setStep={setStep}
          styles={styles}
        />
      )}

      {step === 'booking' && (
        <ApplyBookingStep
          contactEmail={contactEmail}
          contactName={contactName}
          onGoToLogin={onGoToLogin}
        />
      )}
    </div>
  )
}
