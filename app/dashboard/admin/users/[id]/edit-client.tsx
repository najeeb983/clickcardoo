"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function EditUserClient({ id }: { id: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: '' })

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/users/${id}`)
        if (!mounted) return
        if (res.ok) {
          const txt = await res.text().catch(() => '')
          if (txt) {
            try {
              const userData = JSON.parse(txt)
              setData(userData)
              setFormData({
                name: userData.name || '',
                email: userData.email || '',
                password: '',
                role: userData.role || 'EMPLOYEE'
              })
            } catch { }
          }
        }
      } catch (err) { }
      finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    const updateData: any = { name: formData.name, email: formData.email }
    if (formData.password) updateData.password = formData.password
    if (session?.user?.role === 'ADMIN') updateData.role = formData.role

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (res.ok) {
        setSuccess('تم تحديث البيانات بنجاح')
        if (formData.password) setFormData({ ...formData, password: '' })
        setTimeout(() => router.push('/dashboard/admin/users'), 1500)
      } else {
        setError('فشل تحديث البيانات')
      }
    } catch (err) {
      setError('حدث خطأ أثناء التحديث')
    } finally {
      setSaving(false)
    }
  }

  const styles = {
    container: { padding: 16, maxWidth: 600, margin: '0 auto' } as React.CSSProperties,
    form: { border: '1px solid #ddd', borderRadius: 4, padding: 16, backgroundColor: '#f9f9f9' } as React.CSSProperties,
    group: { marginBottom: 12 } as React.CSSProperties,
    label: { display: 'block', fontSize: 14, fontWeight: 'bold', marginBottom: 4, color: '#333' } as React.CSSProperties,
    input: { width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const } as React.CSSProperties,
    error: { color: 'red', backgroundColor: '#ffebee', padding: 8, borderRadius: 4, marginBottom: 12 } as React.CSSProperties,
    success: { color: 'green', backgroundColor: '#e8f5e9', padding: 8, borderRadius: 4, marginBottom: 12 } as React.CSSProperties,
    buttons: { display: 'flex', gap: 8, marginTop: 16 } as React.CSSProperties,
    button: { padding: '8px 16px', cursor: 'pointer', border: 'none', borderRadius: 4, fontWeight: 'bold' } as React.CSSProperties,
    submitButton: { backgroundColor: '#007bff', color: 'white' } as React.CSSProperties,
    cancelButton: { backgroundColor: '#6c757d', color: 'white' } as React.CSSProperties
  }

  if (loading) return <div style={styles.container}>جاري التحميل...</div>
  if (!data) return <div style={styles.container}>لم يتم العثور على المستخدم</div>

  return (
    <div style={styles.container}>
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.group}>
          <label style={styles.label}>الاسم</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.group}>
          <label style={styles.label}>البريد الإلكتروني</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.group}>
          <label style={styles.label}>كلمة المرور (اتركها فارغة للحفاظ على الحالية)</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            style={styles.input}
            placeholder="أدخل كلمة مرور جديدة أو اتركها فارغة"
          />
        </div>

        {session?.user?.role === 'ADMIN' && (
          <div style={styles.group}>
            <label style={styles.label}>الدور</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={styles.input}
            >
              <option value="ADMIN">مسؤول (ADMIN)</option>
              <option value="MANAGER">مدير (MANAGER)</option>
              <option value="EMPLOYEE">موظف (EMPLOYEE)</option>
              <option value="CUSTOMER">عميل (CUSTOMER)</option>
            </select>
          </div>
        )}

        <div style={styles.buttons}>
          <button
            type="submit"
            disabled={saving}
            style={{ ...styles.button, ...styles.submitButton, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ ...styles.button, ...styles.cancelButton }}
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )
}
