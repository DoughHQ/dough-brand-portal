'use client'

import AuthShell from '@/components/auth/AuthShell'
import { ForgotStep } from '@/components/auth/login/ForgotStep'
import { SignInStep } from '@/components/auth/login/SignInStep'
import { useLogin } from '@/components/auth/login/useLogin'

export default function LoginPage() {
  const {
    step,
    setStep,
    loading,
    error,
    setError,
    info,
    setInfo,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    forgotEmail,
    setForgotEmail,
    handleLogin,
    handleForgotPassword,
  } = useLogin()

  return (
    <AuthShell>
      {step === 'login' && (
        <SignInStep
          loading={loading}
          error={error}
          setError={setError}
          setInfo={setInfo}
          setStep={setStep}
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          setForgotEmail={setForgotEmail}
          handleLogin={handleLogin}
        />
      )}

      {step === 'forgot' && (
        <ForgotStep
          loading={loading}
          error={error}
          setError={setError}
          info={info}
          setInfo={setInfo}
          setStep={setStep}
          forgotEmail={forgotEmail}
          setForgotEmail={setForgotEmail}
          handleForgotPassword={handleForgotPassword}
        />
      )}
    </AuthShell>
  )
}
