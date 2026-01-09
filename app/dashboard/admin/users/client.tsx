"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"

interface UserNotifications {
  [userId: string]: number
}

interface UserNewBookings {
  [userId: string]: number
}

export default function UsersClient() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [userNotifications, setUserNotifications] = useState<UserNotifications>({})
  const [userNewBookings, setUserNewBookings] = useState<UserNewBookings>({})

  async function safeParseJSON(res: Response) {
    if (res.status === 204) return null
    const txt = await res.text().catch(() => '')
    if (!txt) return null
    try { return JSON.parse(txt) } catch { return null }
  }

  async function loadNotifications() {
    try {
      const notifications: UserNotifications = {}
      const allUsers = users.length > 0 ? users : await fetch('/api/admin/users').then(r => r.json())
      
      for (const user of allUsers) {
        if (user.role !== 'CUSTOMER') {
          try {
            const res = await fetch('/api/notifications')
            if (res.ok) {
              const notifs = await res.json()
              const unreadCount = notifs.filter((n: any) => !n.isRead).length
              notifications[user.id] = unreadCount
            }
          } catch { }
        }
      }
      setUserNotifications(notifications)
    } catch (err) { }
  }

  async function loadNewBookings() {
    try {
      const newBookings: UserNewBookings = {}
      const allUsers = users.length > 0 ? users : await fetch('/api/admin/users').then(r => r.json())
      
      for (const user of allUsers) {
        try {
          const res = await fetch(`/api/admin/users/${user.id}/new-bookings`)
          if (res.ok) {
            const data = await res.json()
            newBookings[user.id] = data.count
          }
        } catch { }
      }
      setUserNewBookings(newBookings)
    } catch (err) { }
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const body = await safeParseJSON(res)
        if (Array.isArray(body)) {
          setUsers(body)
          loadNotifications()
          loadNewBookings()
        }
        else setUsers([])
      } else {
        setError('فشل تحميل المستخدمين')
      }
    } catch (err) {
      setError('حدث خطأ أثناء التحميل')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(userId: string, currentActive: boolean) {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, action: 'toggle-active' })
      })
      if (res.ok) {
        await load()
      } else {
        setError('فشل تحديث حالة المستخدم')
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحديث الحالة')
    }
  }

  async function deleteUser(userId: string) {
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        await load()
        setDeleteConfirm(null)
      } else {
        setError('فشل حذف المستخدم')
      }
    } catch (err) {
      setError('حدث خطأ أثناء حذف المستخدم')
    }
  }

  useEffect(() => { load() }, [])

  const styles = {
    container: { padding: 16 } as React.CSSProperties,
    header: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 } as React.CSSProperties,
    button: { padding: '8px 16px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 4 } as React.CSSProperties,
    linkButton: { padding: '8px 16px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 4, textDecoration: 'none', display: 'inline-block' } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse', marginTop: 16 } as React.CSSProperties,
    th: { backgroundColor: '#f5f5f5', padding: 12, textAlign: 'right', borderBottom: '2px solid #ddd', fontWeight: 'bold' } as React.CSSProperties,
    td: { padding: 12, borderBottom: '1px solid #ddd' } as React.CSSProperties,
    actions: { display: 'flex', gap: 6 } as React.CSSProperties,
    smallButton: { padding: '4px 8px', fontSize: '12px', cursor: 'pointer', border: 'none', borderRadius: 3 } as React.CSSProperties,
    activeButton: { backgroundColor: '#ffc107', color: 'black' } as React.CSSProperties,
    inactiveButton: { backgroundColor: '#dc3545', color: 'white' } as React.CSSProperties,
    deleteButton: { backgroundColor: '#dc3545', color: 'white' } as React.CSSProperties,
    viewButton: { backgroundColor: '#17a2b8', color: 'white' } as React.CSSProperties,
    error: { color: 'red', marginBottom: 12, padding: 8, backgroundColor: '#ffebee', borderRadius: 4 } as React.CSSProperties,
    statusBadge: (active: boolean) => ({
      padding: '4px 8px',
      borderRadius: 3,
      fontSize: '12px',
      fontWeight: 'bold' as const,
      backgroundColor: active ? '#d4edda' : '#f8d7da',
      color: active ? '#155724' : '#721c24'
    })
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={load} disabled={loading} style={styles.button}>
          {loading ? 'جاري التحميل...' : 'تحديث'}
        </button>
        <Link href="/dashboard/admin/users/create" style={styles.linkButton}>
          إضافة مستخدم جديد
        </Link>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 8, cursor: 'pointer', background: 'none', border: 'none', color: 'red', fontSize: '18px' }}>×</button>
        </div>
      )}

      {users.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>
          لا توجد مستخدمين حالياً
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>الاسم</th>
              <th style={styles.th}>البريد الإلكتروني</th>
              <th style={styles.th}>الدور</th>
              <th style={styles.th}>الحالة</th>
              <th style={styles.th}>تاريخ الإنشاء</th>
              <th style={styles.th}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} style={{ backgroundColor: u.role === 'CUSTOMER' ? '#f0f0f0' : 'transparent' }}>
                <td style={styles.td}>
                  <Link href={`/dashboard/admin/users/${u.id}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{u.name || u.email}</span>
                      {u.role !== 'CUSTOMER' && userNotifications[u.id] > 0 && (
                        <span style={{ backgroundColor: '#dc3545', color: 'white', padding: '2px 6px', borderRadius: 12, fontSize: '11px', fontWeight: 'bold' }}>
                          {userNotifications[u.id]}
                        </span>
                      )}
                    </div>
                  </Link>
                </td>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}>
                  <span style={{ padding: '4px 8px', backgroundColor: u.role === 'ADMIN' ? '#e7d4f5' : '#d1ecf1', borderRadius: 3, fontSize: '12px', fontWeight: 'bold' }}>
                    {u.role === 'ADMIN' ? 'مسؤول' : u.role === 'MANAGER' ? 'مدير': u.role === 'CUSTOMER' ? 'عميل' : 'موظف'}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={styles.statusBadge(u.active !== false)}>
                    {u.active !== false ? 'مفعل' : 'معطل'}
                  </span>
                </td>
                <td style={styles.td}>
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-EG') : '—'}
                </td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <Link
                      href={`/dashboard/admin/users/${u.id}`}
                      style={{ ...styles.smallButton, ...styles.viewButton }}
                    >
                      عرض
                    </Link>
                    <Link
                      href={`/dashboard/bookings?userId=${u.id}`}
                      style={{ ...styles.smallButton, backgroundColor: '#6f42c1', color: 'white', position: 'relative' }}
                    >
                      حجوزاته
                      {userNewBookings[u.id] > 0 && (
                        <span style={{ position: 'absolute', top: -5, right: -5, backgroundColor: '#ff3333', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                          {userNewBookings[u.id]}
                        </span>
                      )}
                    </Link>
                    <Link
                      href={`/dashboard/finance?userId=${u.id}`}
                      style={{ ...styles.smallButton, backgroundColor: '#20c997', color: 'white' }}
                    >
                      سجل مالي
                    </Link>
                    <Link
                      href={`/dashboard/bank-cards?userId=${u.id}`}
                      style={{ ...styles.smallButton, backgroundColor: '#0dcaf0', color: 'white' }}
                    >
                      بطاقات
                    </Link>
                    {u.active !== false ? (
                      <button
                        onClick={() => toggleActive(u.id, true)}
                        style={{ ...styles.smallButton, ...styles.inactiveButton }}
                      >
                        تعطيل
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleActive(u.id, false)}
                        style={{ ...styles.smallButton, ...styles.activeButton }}
                      >
                        تفعيل
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteConfirm(u.id)}
                      style={{ ...styles.smallButton, ...styles.deleteButton }}
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', textAlign: 'center', maxWidth: 400 }}>
            <h2 style={{ marginBottom: 12, color: '#333' }}>تأكيد الحذف</h2>
            <p style={{ marginBottom: 24, color: '#666' }}>هل أنت متأكد من رغبتك في حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => deleteUser(deleteConfirm)}
                style={{ ...styles.button, backgroundColor: '#dc3545' }}
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{ ...styles.button, backgroundColor: '#6c757d' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
