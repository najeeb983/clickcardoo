"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

export default function UserDetailClient({ id }: { id: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/users/${id}`)
        if (!mounted) return
        if (res.ok) {
          if (res.status === 204) {
            setData(null)
          } else {
            const txt = await res.text().catch(() => '')
            if (!txt) setData(null)
            else {
              try { setData(JSON.parse(txt)) }
              catch { setError('خطأ في تحليل البيانات') }
            }
          }
        } else {
          setError(`فشل تحميل البيانات - الحالة: ${res.status}`)
        }
      } catch (err: any) {
        console.error('UserDetailClient fetch error:', err)
        if (!mounted) return
        setError(String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [id])

  const styles = {
    container: { padding: 16, maxWidth: 1200, margin: '0 auto' } as React.CSSProperties,
    backButton: { marginBottom: 16, color: '#007bff', cursor: 'pointer', textDecoration: 'none' } as React.CSSProperties,
    header: { marginBottom: 24, borderBottom: '2px solid #eee', paddingBottom: 16 } as React.CSSProperties,
    userInfo: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12, marginBottom: 16 } as React.CSSProperties,
    infoCard: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 4, border: '1px solid #e0e0e0' } as React.CSSProperties,
    label: { fontWeight: 'bold', color: '#555', marginBottom: 4, fontSize: '12px' } as React.CSSProperties,
    value: { fontSize: '16px', color: '#333' } as React.CSSProperties,
    statsContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 } as React.CSSProperties,
    statCard: { backgroundColor: '#f0f8ff', padding: 16, borderRadius: 4, border: '1px solid #b0d4ff', textAlign: 'center' as const } as React.CSSProperties,
    statNumber: { fontSize: '28px', fontWeight: 'bold', color: '#007bff' } as React.CSSProperties,
    statLabel: { fontSize: '14px', color: '#666', marginTop: 4 } as React.CSSProperties,
    section: { marginBottom: 24 } as React.CSSProperties,
    sectionTitle: { fontSize: '18px', fontWeight: 'bold', marginBottom: 12, color: '#333', borderBottom: '2px solid #ddd', paddingBottom: 8 } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse' } as React.CSSProperties,
    th: { backgroundColor: '#f5f5f5', padding: 8, textAlign: 'right' as const, borderBottom: '2px solid #ddd', fontWeight: 'bold', fontSize: '12px' } as React.CSSProperties,
    td: { padding: 8, borderBottom: '1px solid #ddd', fontSize: '14px' } as React.CSSProperties,
    emptyState: { padding: 12, textAlign: 'center' as const, color: '#999' } as React.CSSProperties,
    error: { color: 'red', backgroundColor: '#ffebee', padding: 12, borderRadius: 4, marginBottom: 12 } as React.CSSProperties,
    badge: (type: string) => ({
      padding: '4px 8px',
      borderRadius: 3,
      fontSize: '11px',
      fontWeight: 'bold' as const,
      backgroundColor: type === 'CREDIT' || type === 'PAID' || type === 'CONFIRMED' ? '#d4edda' : type === 'COMPLETED' ? '#cce5ff' : type === 'PENDING' ? '#fff3cd' : '#f8d7da',
      color: type === 'CREDIT' || type === 'PAID' || type === 'CONFIRMED' ? '#155724' : type === 'COMPLETED' ? '#004085' : type === 'PENDING' ? '#856404' : '#721c24'
    }),
    roleColor: (role: string) => ({
      padding: '4px 8px',
      borderRadius: 3,
      fontSize: '11px',
      fontWeight: 'bold' as const,
      backgroundColor: role === 'ADMIN' ? '#e7d4f5' : role === 'MANAGER' ? '#d1ecf1' : '#f0f0f0',
      color: role === 'ADMIN' ? '#6f3fa0' : role === 'MANAGER' ? '#0c5460' : '#333'
    })
  }

  if (loading) {
    return <div style={styles.container}><div>جاري التحميل...</div></div>
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Link href="/dashboard/admin/users" style={styles.backButton}>← العودة إلى قائمة المستخدمين</Link>
        <div style={styles.error}>{error}</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={styles.container}>
        <Link href="/dashboard/admin/users" style={styles.backButton}>← العودة إلى قائمة المستخدمين</Link>
        <div>لا توجد بيانات</div>
      </div>
    )
  }

  const editButton = { padding: '8px 16px', cursor: 'pointer', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: 4, fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', marginLeft: 8 } as React.CSSProperties

  const totalBookings = data.bookings?.length || 0
  const totalRevenue = data.finances?.reduce((sum: number, f: any) => f.type === 'CREDIT' ? sum + parseFloat(f.amount) : sum, 0) || 0
  const totalExpenses = data.finances?.reduce((sum: number, f: any) => f.type === 'DEBIT' ? sum + parseFloat(f.amount) : sum, 0) || 0
  const completedBookings = data.bookings?.filter((b: any) => b.status === 'COMPLETED').length || 0
  const totalExcessActions = data.excessActions?.length || 0

  const roleDisplay = data.role === 'ADMIN' ? 'مسؤول النظام' : data.role === 'MANAGER' ? 'مدير' : 'موظف'

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Link href="/dashboard/admin/users" style={styles.backButton}>← العودة إلى قائمة المستخدمين</Link>
        <Link href={`/dashboard/admin/users/${id}/edit-page`} style={editButton}>
          ✏️ تعديل المستخدم
        </Link>
      </div>

      <div style={styles.header}>
        <h1>{data.name || data.email}</h1>
        <div style={styles.userInfo}>
          <div style={styles.infoCard}>
            <div style={styles.label}>البريد الإلكتروني</div>
            <div style={styles.value}>{data.email}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.label}>الدور</div>
            <div style={styles.value}>
              <span style={styles.roleColor(data.role)}>{roleDisplay}</span>
            </div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.label}>الحالة</div>
            <div style={styles.value}>
              <span style={{ ...styles.badge(data.active ? 'PAID' : 'PENDING'), padding: '6px 12px', fontSize: '13px' }}>
                {data.active !== false ? 'مفعل' : 'معطل'}
              </span>
            </div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.label}>تاريخ الإنشاء</div>
            <div style={styles.value}>
              {data.createdAt ? new Date(data.createdAt).toLocaleDateString('ar-EG') : '—'}
            </div>
          </div>
          {data.updatedAt && (
            <div style={styles.infoCard}>
              <div style={styles.label}>آخر تحديث</div>
              <div style={styles.value}>
                {new Date(data.updatedAt).toLocaleDateString('ar-EG')}
              </div>
            </div>
          )}
          {data.phone && (
            <div style={styles.infoCard}>
              <div style={styles.label}>رقم الهاتف</div>
              <div style={styles.value}>{data.phone}</div>
            </div>
          )}
        </div>
      </div>

      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{totalBookings}</div>
          <div style={styles.statLabel}>إجمالي الحجوزات</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{completedBookings}</div>
          <div style={styles.statLabel}>الحجوزات المكتملة</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{totalExcessActions}</div>
          <div style={styles.statLabel}>عمليات التجاوزات</div>
        </div>
        <div style={{ ...styles.statCard, backgroundColor: '#f0fff4', borderColor: '#b0ffb0' }}>
          <div style={{ ...styles.statNumber, color: '#28a745' }}>{totalRevenue.toFixed(2)}</div>
          <div style={styles.statLabel}>إجمالي الإيرادات</div>
        </div>
        <div style={{ ...styles.statCard, backgroundColor: '#fff0f0', borderColor: '#ffb0b0' }}>
          <div style={{ ...styles.statNumber, color: '#dc3545' }}>{totalExpenses.toFixed(2)}</div>
          <div style={styles.statLabel}>إجمالي المصروفات</div>
        </div>
        <div style={{ ...styles.statCard, backgroundColor: '#f5f0ff', borderColor: '#d0b0ff' }}>
          <div style={{ ...styles.statNumber, color: '#6f42c1' }}>{(totalRevenue - totalExpenses).toFixed(2)}</div>
          <div style={styles.statLabel}>الرصيد الصافي</div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>📋 الحجوزات ({totalBookings})</div>
        {data.bookings?.length ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>معرف العقد</th>
                <th style={styles.th}>حالة الحجز</th>
                <th style={styles.th}>عدد الأيام</th>
                <th style={styles.th}>السعر اليومي</th>
                <th style={styles.th}>تاريخ البداية</th>
                <th style={styles.th}>تاريخ النهاية</th>
              </tr>
            </thead>
            <tbody>
              {data.bookings.map((b: any) => (
                <tr key={b.id}>
                  <td style={styles.td}>{b.contractId}</td>
                  <td style={styles.td}>
                    <span style={styles.badge(b.status)}>
                      {b.status === 'PENDING' ? 'قيد الانتظار' : b.status === 'PAID' ? 'مدفوع' : b.status === 'CONFIRMED' ? 'موافق عليه' : b.status === 'COMPLETED' ? 'مكتمل' : 'ملغى'}
                    </span>
                  </td>
                  <td style={styles.td}>{b.rentalDays}</td>
                  <td style={styles.td}>{b.dailyRate}</td>
                  <td style={styles.td}>{new Date(b.startDate).toLocaleDateString('ar-EG')}</td>
                  <td style={styles.td}>{new Date(b.endDate).toLocaleDateString('ar-EG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.emptyState}>لا توجد حجوزات</div>
        )}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>💼 عمليات التجاوزات ({totalExcessActions})</div>
        {data.excessActions?.length ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>نوع العملية</th>
                <th style={styles.th}>الوصف</th>
                <th style={styles.th}>التفاصيل</th>
                <th style={styles.th}>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {data.excessActions.map((e: any) => (
                <tr key={e.id}>
                  <td style={styles.td}>
                    <span style={styles.badge('COMPLETED')}>{e.actionType}</span>
                  </td>
                  <td style={styles.td}>{e.description}</td>
                  <td style={styles.td}>{e.details || '—'}</td>
                  <td style={styles.td}>{new Date(e.createdAt).toLocaleDateString('ar-EG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.emptyState}>لا توجد عمليات تجاوزات</div>
        )}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>💰 السجل المالي ({data.finances?.length || 0})</div>
        {data.finances?.length ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>النوع</th>
                <th style={styles.th}>المبلغ</th>
                <th style={styles.th}>الوصف</th>
                <th style={styles.th}>المرجع</th>
                <th style={styles.th}>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {data.finances.map((f: any) => (
                <tr key={f.id} style={{ backgroundColor: f.type === 'CREDIT' ? '#f0fff4' : '#fff5f5' }}>
                  <td style={styles.td}>
                    <span style={styles.badge(f.type)}>
                      {f.type === 'CREDIT' ? 'إيراد' : 'مصروف'}
                    </span>
                  </td>
                  <td style={{ ...styles.td, color: f.type === 'CREDIT' ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                    {f.type === 'CREDIT' ? '+' : '-'}{f.amount}
                  </td>
                  <td style={styles.td}>{f.description}</td>
                  <td style={styles.td}>{f.reference || '—'}</td>
                  <td style={styles.td}>{new Date(f.createdAt).toLocaleDateString('ar-EG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.emptyState}>لا توجد سجلات مالية</div>
        )}
      </div>
    </div>
  )
}
