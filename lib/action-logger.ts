import prisma from './prisma'

export type ActionType =
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_DELETED'
  | 'STATUS_CHANGED'
  | 'NOTES_UPDATED'
  | 'DESCRIPTION_UPDATED'
  | 'EXCESS_CREATED'
  | 'EXCESS_DELETED'

export interface LogActionParams {
  excessId: string
  accountId: string
  actionType: ActionType
  description: string
  details?: string
}

/**
 * تسجيل إجراء في سجل العمليات
 * @param params معاملات تسجيل الإجراء
 */
export async function logAction(params: LogActionParams) {
  try {
    const action = await prisma.excessAction.create({
      data: {
        excessId: params.excessId,
        accountId: params.accountId,
        actionType: params.actionType,
        description: params.description,
        details: params.details,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    console.log('[Action Logger] تم تسجيل الإجراء:', {
      excessId: params.excessId,
      actionType: params.actionType,
      description: params.description,
    })

    return action
  } catch (error) {
    console.error('[Action Logger] خطأ أثناء تسجيل الإجراء:', error)
    return null
  }
}

/**
 * تسجيل رفع مستند
 */
export async function logDocumentUpload(
  excessId: string,
  accountId: string,
  documentType: string,
  documentLabel: string,
  fileName: string
) {
  return logAction({
    excessId,
    accountId,
    actionType: 'DOCUMENT_UPLOADED',
    description: `تم رفع مستند: ${documentLabel}`,
    details: `نوع المستند: ${documentType}, اسم الملف: ${fileName}`,
  })
}

/**
 * تسجيل حذف مستند
 */
export async function logDocumentDelete(
  excessId: string,
  accountId: string,
  documentType: string,
  documentLabel: string
) {
  return logAction({
    excessId,
    accountId,
    actionType: 'DOCUMENT_DELETED',
    description: `تم حذف مستند: ${documentLabel}`,
    details: `نوع المستند: ${documentType}`,
  })
}

/**
 * تسجيل تغيير الحالة
 */
export async function logStatusChange(
  excessId: string,
  accountId: string,
  fromStatus: string,
  toStatus: string,
  reason?: string
) {
  return logAction({
    excessId,
    accountId,
    actionType: 'STATUS_CHANGED',
    description: `تم تغيير الحالة من "${fromStatus}" إلى "${toStatus}"`,
    details: reason ? `السبب: ${reason}` : undefined,
  })
}

/**
 * تسجيل تحديث الملاحظات
 */
export async function logNotesUpdate(
  excessId: string,
  accountId: string,
  previousNotes: string | null,
  newNotes: string | null
) {
  return logAction({
    excessId,
    accountId,
    actionType: 'NOTES_UPDATED',
    description: 'تم تحديث الملاحظات',
    details: `الملاحظات السابقة: ${previousNotes || 'بدون ملاحظات'}, الملاحظات الجديدة: ${newNotes || 'بدون ملاحظات'}`,
  })
}

/**
 * تسجيل تحديث الوصف
 */
export async function logDescriptionUpdate(
  excessId: string,
  accountId: string,
  previousDescription: string | null,
  newDescription: string | null
) {
  return logAction({
    excessId,
    accountId,
    actionType: 'DESCRIPTION_UPDATED',
    description: 'تم تحديث الوصف',
    details: `الوصف السابق: ${previousDescription || 'بدون وصف'}, الوصف الجديد: ${newDescription || 'بدون وصف'}`,
  })
}
