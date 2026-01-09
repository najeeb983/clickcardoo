import Link from "next/link"

export default function AdminIndex() {
  return (
    <div>
      <h1>لوحة الإدارة</h1>
      <ul>
        <li><Link href="/dashboard/admin/users">إدارة المستخدمين</Link></li>
        <li><Link href="/dashboard/admin/finance">المالية (Admin)</Link></li>
      </ul>
    </div>
  )
}
