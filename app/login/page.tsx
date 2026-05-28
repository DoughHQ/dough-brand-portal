'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()
  async function handleLogin() {
    if (!email || !password) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }
  return (
    <div style={{ minHeight:'100vh', background:'var(--surface)', display:'grid', placeItems:'center', padding:'24px' }}>
      <div style={{ width:'100%', maxWidth:'400px', display:'flex', flexDirection:'column', gap:'32px' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:'var(--font-serif)', fontSize:'28px', fontWeight:700, color:'var(--sage)', letterSpacing:'-0.5px' }}>dough<span style={{ color:'var(--ink-30)', fontWeight:400 }}>.</span></div>
          <div style={{ fontSize:'11px', fontWeight:600, letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--ink-30)', marginTop:'4px' }}>Brand Intelligence</div>
        </div>
        <div style={{ background:'var(--white)', borderRadius:'var(--r-xl)', border:'1px solid var(--ink-10)', padding:'32px', display:'flex', flexDirection:'column', gap:'20px' }}>
          <div>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:'20px', fontWeight:600, color:'var(--ink)', marginBottom:'6px' }}>Welcome back.</div>
            <div style={{ fontSize:'13px', color:'var(--ink-50)', lineHeight:1.5 }}>Sign in to your brand intelligence dashboard.</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            <label style={{ fontSize:'11px', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'var(--ink-50)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@yourbrand.com"
              style={{ padding:'10px 14px', borderRadius:'var(--r-sm)', border:'1px solid var(--ink-10)', background:'var(--surface)', fontSize:'14px', color:'var(--ink)', outline:'none' }}
              onFocus={e => e.target.style.borderColor='var(--sage)'} onBlur={e => e.target.style.borderColor='var(--ink-10)'} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            <label style={{ fontSize:'11px', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'var(--ink-50)' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••"
              style={{ padding:'10px 14px', borderRadius:'var(--r-sm)', border:'1px solid var(--ink-10)', background:'var(--surface)', fontSize:'14px', color:'var(--ink)', outline:'none' }}
              onFocus={e => e.target.style.borderColor='var(--sage)'} onBlur={e => e.target.style.borderColor='var(--ink-10)'} />
          </div>
          {error && <div style={{ fontSize:'12px', color:'var(--red)', background:'var(--red-pale)', padding:'10px 12px', borderRadius:'var(--r-sm)' }}>{error}</div>}
          <button onClick={handleLogin} disabled={loading || !email || !password}
            style={{ padding:'12px', background:loading||!email||!password?'var(--ink-10)':'var(--sage)', color:loading||!email||!password?'var(--ink-30)':'white', borderRadius:'var(--r-sm)', fontSize:'14px', fontWeight:600, cursor:loading||!email||!password?'not-allowed':'pointer', fontFamily:'var(--font-sans)', border:'none' }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
