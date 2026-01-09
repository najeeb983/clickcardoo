import UserDetailClient from './client'

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  return (
    <div>
      <h1>تفاصيل المستخدم</h1>
      <UserDetailClient id={id} />
    </div>
  )
}
