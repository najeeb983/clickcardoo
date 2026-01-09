import CreateUserForm from './create-client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function CreateUserPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    // Server-side redirect for non-admins
    redirect('/dashboard')
  }

  return (
    <div style={{ padding: 12 }}>
      <h1>إضافة مستخدم جديد</h1>
      <CreateUserForm />
    </div>
  )
}
