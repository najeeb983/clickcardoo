import { prisma } from './prisma'

export async function createNotificationForAdminsAndEmployees(
  type: 'BOOKING_CREATED' | 'EXCESS_CREATED',
  title: string,
  message: string,
  bookingId?: string,
  excessId?: string
) {
  try {
    const adminsAndEmployees = await (prisma.account as any).findMany({
      where: {
        role: { in: ['ADMIN', 'EMPLOYEE'] },
        active: true
      },
      select: { id: true }
    })

    const notifications = adminsAndEmployees.map((user: any) => ({
      accountId: user.id,
      type,
      title,
      message,
      bookingId,
      excessId,
      isRead: false
    }))

    if (notifications.length > 0) {
      await (prisma.notification as any).createMany({
        data: notifications
      })
    }

    return true
  } catch (err) {
    console.error('Error creating notifications:', err)
    return false
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    await (prisma.notification as any).update({
      where: { id: notificationId },
      data: { isRead: true }
    })
    return true
  } catch (err) {
    console.error('Error marking notification as read:', err)
    return false
  }
}

export async function getUnreadNotificationCount(accountId: string) {
  try {
    const count = await (prisma.notification as any).count({
      where: {
        accountId,
        isRead: false
      }
    })
    return count
  } catch (err) {
    console.error('Error getting unread notification count:', err)
    return 0
  }
}
