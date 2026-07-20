import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import CreateCompareGroupForm from './CreateCompareGroupForm'

export default async function NewCompareGroupPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') redirect('/dashboard')

  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        maxWidth: 720,
        margin: '0 auto',
        padding: '36px 32px 96px',
      }}
    >
      <Link
        href="/admin/compare-groups"
        style={{
          fontSize: 13,
          color: 'var(--ink-50)',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: 20,
        }}
      >
        ← Compare Groups
      </Link>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 32,
          fontWeight: 400,
          color: 'var(--ink)',
          margin: '0 0 8px',
        }}
      >
        Create compare group
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ink-50)', margin: '0 0 28px' }}>
        Define who competes and the question shoppers answer.
      </p>
      <CreateCompareGroupForm />
    </div>
  )
}
