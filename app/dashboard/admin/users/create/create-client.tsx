"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

function validateEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email)
}

function validatePassword(pw: string) {
  return pw.length >= 8
}

export default function CreateUserForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('EMPLOYEE')
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [success, setSuccess] = useState<string | null>(null)

  function runValidation() {
    const fe: { email?: string; password?: string } = {}
    if (!validateEmail(email)) fe.email = 'الايميل غير صالح'
    if (!validatePassword(password)) fe.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
    setFieldErrors(fe)
    return Object.keys(fe).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!runValidation()) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, active }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body?.error || `Status ${res.status}`)
        setLoading(false)
        return
      }
      const created = await res.json().catch(() => null)
      setSuccess('تم إنشاء المستخدم بنجاح')
      // clear sensitive fields
      setPassword('')
    } catch (err: any) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 640, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>الاسم</label>
        <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: 8 }} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>الايميل</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        {fieldErrors.email && <div style={{ color: 'red' }}>{fieldErrors.email}</div>}
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>كلمة المرور</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        {fieldErrors.password && <div style={{ color: 'red' }}>{fieldErrors.password}</div>}
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>الدور</label>
        <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: 8 }}>
          <option value="EMPLOYEE">EMPLOYEE</option>
          <option value="ADMIN">ADMIN</option>
          <option value="CUSTOMER">CUSTOMER</option>
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 14 }}>
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> مفعل
        </label>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 8 }}>خطأ: {error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 8 }}>{success}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>{loading ? 'جاري...' : 'إنشاء'}</button>
        <button type="button" onClick={() => router.push('/dashboard/admin/users')} style={{ padding: '8px 16px' }}>الرجوع إلى القائمة</button>
      </div>
    </form>
  )
}
