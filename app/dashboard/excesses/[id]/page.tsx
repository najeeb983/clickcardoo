'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/components/translation-provider';
import Link from 'next/link';
import { ArrowLeft, Download, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ExcessDetailsResponse {
  excess: {
    id: string;
    type: string;
    amount: string;
    description?: string;
    status: 'NEED_UPDATE' | 'APPROVED' | 'DECLINED';
    createdAt: string;
    updatedAt: string;
  };
  booking: {
    id: string;
    contractId: string;
    startDate: string;
    endDate: string;
    rentalType: string;
    customerName: string;
  };
  documents: Array<{
    type: string;
    url: string | null;
    label: string;
  }>;
  actions: Array<{
    id: string;
    actionType: string;
    description: string;
    details?: string;
    createdAt: string;
    account: {
      id: string;
      name: string;
    };
  }>;
}

export default function ExcessDetailsPage() {
  const params = useParams();
  const { t } = useTranslation();
  const [data, setData] = useState<ExcessDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const locale = 'ar';

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const url = '/api/excesses/' + params.id + '/details';
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch excess details');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDetails();
    }
  }, [params.id]);

  const handleDownload = async (fileUrl: string | null, documentLabel: string, docType: string) => {
    if (!fileUrl) return;

    try {
      setDownloading(docType);
      setDownloadError(null);

      // Check if it's a local file or full URL
      let downloadUrl: string;
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        // Full URL - use API endpoint
        downloadUrl = '/api/excesses/' + params.id + '/download?type=' + docType;
      } else {
        // Local file - download directly from public folder
        downloadUrl = '/documents/' + fileUrl;
      }

      const response = await fetch(downloadUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to download file');
      }

      // Get filename for download
      let filename = documentLabel;
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]*)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Download error:', err);
      setDownloadError(errorMsg);
    } finally {
      setDownloading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      NEED_UPDATE: {
        label: t('needUpdate'),
        className: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: <AlertCircle className="w-4 h-4" />,
      },
      APPROVED: {
        label: t('approved'),
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle2 className="w-4 h-4" />,
      },
      DECLINED: {
        label: t('declined'),
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="w-4 h-4" />,
      },
    };

    const config = statusMap[status] || statusMap.NEED_UPDATE;
    return (
      <Badge className={config.className}>
        <span className="flex items-center gap-2">
          {config.icon}
          {config.label}
        </span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loader"></div>
          <p className="mt-4">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <Link href="/dashboard/excesses">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 ml-2" />
            {t('back')}
          </Button>
        </Link>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error || 'Failed to load excess details'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { excess, booking, documents, actions } = data;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Link href="/dashboard/excesses">
        <Button variant="outline">
          <ArrowLeft className="w-4 h-4 ml-2" />
          {t('back')}
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('excessDetails')}</CardTitle>
              <CardDescription>{excess.id}</CardDescription>
            </div>
            {getStatusBadge(excess.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{t('excessType')}</p>
              <p className="text-lg font-semibold">{excess.type}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{t('amount')}</p>
              <p className="text-lg font-semibold">{parseFloat(excess.amount).toFixed(2)} AED</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{t('status')}</p>
              {getStatusBadge(excess.status)}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{t('contractId')}</p>
              <p className="text-lg font-semibold">{booking.contractId}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{t('rentalStartDate')}</p>
              <p className="text-lg font-semibold">
                {format(new Date(booking.startDate), 'dd/MM/yyyy', {
                  locale: locale === 'ar' ? ar : undefined,
                })}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{t('rentalEndDate')}</p>
              <p className="text-lg font-semibold">
                {format(new Date(booking.endDate), 'dd/MM/yyyy', {
                  locale: locale === 'ar' ? ar : undefined,
                })}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{t('createdAt')}</p>
              <p className="text-lg font-semibold">
                {format(new Date(excess.createdAt), 'dd/MM/yyyy HH:mm', {
                  locale: locale === 'ar' ? ar : undefined,
                })}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{t('rentalType')}</p>
              <p className="text-lg font-semibold">{booking.rentalType}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{t('customerName')}</p>
              <p className="text-lg font-semibold">{booking.customerName}</p>
            </div>

            {excess.description && (
              <div className="space-y-2 col-span-full">
                <p className="text-sm font-medium text-gray-600">{t('description')}</p>
                <p className="text-lg">{excess.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('uploadedDocuments')}</CardTitle>
        </CardHeader>
        <CardContent>
          {downloadError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
              Download error: {downloadError}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('documentType')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.type}>
                  <TableCell className="font-medium">{doc.label}</TableCell>
                  <TableCell>
                    {doc.url ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {t('uploaded')}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                        {t('notUploaded')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {doc.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(doc.url, doc.label, doc.type)}
                        disabled={downloading === doc.type}
                      >
                        <Download className="w-4 h-4" />
                        {downloading === doc.type ? ' Downloading...' : ' Download'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('actionsHistory')}</CardTitle>
          <CardDescription>{t('allActionsAndUpdates')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('accountName')}</TableHead>
                <TableHead>{t('action')}</TableHead>
                <TableHead>{t('details')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((action) => (
                <TableRow key={action.id}>
                  <TableCell>
                    {format(new Date(action.createdAt), 'dd/MM/yyyy HH:mm', {
                      locale: locale === 'ar' ? ar : undefined,
                    })}
                  </TableCell>
                  <TableCell className="font-medium">{action.account.name}</TableCell>
                  <TableCell>{action.actionType}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p>{action.description}</p>
                      {action.details && <p className="text-sm text-gray-600">{action.details}</p>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}