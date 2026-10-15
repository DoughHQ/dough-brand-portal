import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getPortalAppUrl } from '@/lib/brand'
import { resetRequestErrorCopy, signInErrorCopy } from '@/lib/auth/authErrorCopy'
import { parseUrlErrors, type Step } from './loginModel'

export type LoginState = ReturnType<typeof useLogin>

export function useLogin() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const { error: urlError, errorCode } = parseUrlErrors()

    if (urlError || errorCode) {
      setStep('login')
      if (errorCode === 'otp_expired' || urlError === 'otp_expired') {
        setError('This reset link has expired or was already used. Request a new one below.')
      } else if (urlError === 'auth_callback_failed') {
        setError(
          'Reset link failed. Open it in the same browser (and Chrome profile) you used to request the reset, or request a new link below.'
        )
      } else {
        setError('Sign-in link failed. Please try again.')
      }
      window.history.replaceState(null, '', window.location.pathname)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/auth/update-password')
      }
    })

    const hashRaw = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash
    const hashParams = new URLSearchParams(hashRaw)
    if (hashParams.get('type') === 'recovery') {
      router.replace('/auth/update-password')
    }

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogin() {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Email and password are required.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim().toLowerCase(),
      password: loginPassword.trim(),
    })
    setLoading(false)
    if (signInError) {
      setError(signInErrorCopy(signInError, 'login'))
      return
    }
    router.push('/dashboard')
  }

  async function handleForgotPassword() {
    if (!forgotEmail.trim()) {
      setError('Email is required.')
      return
    }
    setLoading(true)
    setError(null)
    setInfo(null)

    const appUrl = getPortalAppUrl()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      forgotEmail.trim().toLowerCase(),
      {
        redirectTo: `${appUrl}/auth/callback?next=/auth/update-password`,
      }
    )

    setLoading(false)
    if (resetError) {
      const copy = resetRequestErrorCopy(resetError)
      if (copy) {
        setError(copy)
        return
      }
    }
    setInfo(
      'If an account exists for that email, a reset link is on its way. Open it in this same browser.'
    )
  }

  return {
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
  }
}
