'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FileText, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import styles from './page.module.css';

export default function ReportViewGate() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = params.id as string;
  const tokenParam = searchParams.get('token');

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  // Fetch report details and set PDF URL if token is present
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch(`/api/reports/${reportId}`);
        if (!res.ok) throw new Error('Report not found');
        const data = await res.json();
        setReport(data);

        // If we have a token from the modal redirect, set the PDF serve URL directly
        if (tokenParam) {
          setPdfUrl(`/api/reports/serve/${reportId}?token=${tokenParam}`);
        }
      } catch (err) {
        setError('This report could not be found.');
      } finally {
        setLoading(false);
      }
    }
    if (reportId) init();
  }, [reportId, tokenParam]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <Loader2 size={32} className={styles.spinner} />
          <span>Loading document...</span>
        </div>
      </div>
    );
  }

  if (!report || error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h2>Report Not Found</h2>
          <p>The requested report does not exist or has been removed.</p>
          <button onClick={() => router.push('/reports')} className={styles.backBtn}>
            <ArrowLeft size={16} />
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  // PDF viewer
  if (pdfUrl) {
    return (
      <div className={styles.page}>
        <div className={styles.viewerHeader}>
          <button onClick={() => router.push('/reports')} className={styles.backBtn}>
            <ArrowLeft size={16} />
            Back to Reports
          </button>
          <div className={styles.viewerTitleBlock}>
            <h1>{report.title}</h1>
            <span className={styles.viewerMeta}>{report.category} • {report.year} • {report.page_count} pages</span>
          </div>
        </div>
        <div className={styles.pdfContainer}>
          <iframe
            src={pdfUrl}
            className={styles.pdfViewer}
            title={report.title}
            allow="fullscreen"
          />
        </div>
      </div>
    );
  }

  // No token — redirect to reports page
  return (
    <div className={styles.page}>
      <div className={styles.errorState}>
        <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
        <h2>{report.title}</h2>
        <p style={{ maxWidth: '460px', lineHeight: 1.6, marginTop: '8px' }}>
          To view this document, please go to the Reports page and click &quot;View Report&quot;.
        </p>
        <button onClick={() => router.push('/reports')} className={styles.backBtn} style={{ marginTop: '20px' }}>
          <ArrowLeft size={16} />
          Go to Reports
        </button>
      </div>
    </div>
  );
}
