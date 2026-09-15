import AdminHome from '@/components/adminHome/AdminHome'
import type { AdminHomeSnapshot } from '@/lib/adminHome/types'

export default function AdminDashboardClient({ snapshot }: { snapshot: AdminHomeSnapshot }) {
  return <AdminHome snapshot={snapshot} />
}
