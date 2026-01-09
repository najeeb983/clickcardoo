import EditUserClient from './edit-client'

export default function EditUserPage({ params }: { params: { id: string } }) {
  const { id } = params
  return (
    <div>
      <h1>تعديل المستخدم</h1>
      <EditUserClient id={id} />
    </div>
  )
}
