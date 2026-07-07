'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface Report {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: { id: string; username: string };
  assignedTo: { id: string; username: string } | null;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`http://localhost:3001/api/v1/admin/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      setReports(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchReports();
  }, [fetchReports]);

  const handleResolve = async (reportId: string, action: 'RESOLVED' | 'DISMISSED') => {
    setActionLoading(reportId);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:3001/api/v1/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, reason: `Report ${action.toLowerCase()} by moderator` }),
      });
      if (res.ok) {
        await fetchReports();
      }
    } catch (err) {
      console.error('Error resolving report:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      PENDING: { bg: '#FFF5F5', color: '#E53E3E' },
      REVIEWING: { bg: '#FEFCE8', color: '#D69E2E' },
      RESOLVED: { bg: '#F0FFF4', color: '#38A169' },
      DISMISSED: { bg: '#F7FAFC', color: '#718096' },
    };
    const c = colors[status] ?? { bg: '#FFF5F5', color: '#E53E3E' };
    return (
      <span style={{
        background: c.bg, color: c.color, padding: '4px 10px',
        borderRadius: 6, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
      }}>
        {status}
      </span>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-page-title { font-size: 1.6rem; font-weight: 900; color: #1a202c; margin: 0 0 8px 0; }
        .admin-page-subtitle { font-size: 0.92rem; color: #718096; margin-bottom: 24px; }

        .reports-filters {
          display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap;
        }

        .filter-btn {
          padding: 8px 16px; border-radius: 8px; border: 1px solid #e2e8f0;
          background: white; color: #4a5568; font-weight: 700; font-size: 0.82rem;
          cursor: pointer; transition: all 0.15s;
        }
        .filter-btn:hover { border-color: #FF416C; color: #FF416C; }
        .filter-btn.active { background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%); color: white; border-color: transparent; }

        .reports-table {
          width: 100%; border-collapse: separate; border-spacing: 0;
          border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;
        }
        .reports-table th {
          background: #f8fafc; padding: 14px 16px; text-align: left;
          font-size: 0.78rem; font-weight: 800; color: #a0aec0;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .reports-table td {
          padding: 14px 16px; border-top: 1px solid #f1f5f9;
          font-size: 0.88rem; color: #4a5568;
        }
        .reports-table tr:hover td { background: rgba(255, 65, 108, 0.02); }

        .action-btn {
          padding: 6px 12px; border-radius: 6px; border: none;
          font-weight: 700; font-size: 0.78rem; cursor: pointer; transition: all 0.15s;
          margin-right: 6px;
        }
        .action-btn.resolve { background: #F0FFF4; color: #38A169; }
        .action-btn.resolve:hover { background: #C6F6D5; }
        .action-btn.dismiss { background: #F7FAFC; color: #718096; }
        .action-btn.dismiss:hover { background: #EDF2F7; }

        .pagination { display: flex; gap: 8px; align-items: center; margin-top: 24px; justify-content: center; }
        .page-btn {
          padding: 8px 14px; border-radius: 8px; border: 1px solid #e2e8f0;
          background: white; font-weight: 700; font-size: 0.82rem; cursor: pointer;
        }
        .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .page-info { font-size: 0.85rem; color: #718096; font-weight: 600; }

        .empty-reports {
          text-align: center; padding: 60px 0; color: #a0aec0;
        }
        .empty-reports .empty-icon { font-size: 3rem; margin-bottom: 12px; }
        .empty-reports p { font-size: 1rem; font-weight: 700; }

        @media (prefers-color-scheme: dark) {
          .admin-page-title { color: #e2e8f0; }
          .filter-btn { background: #0a0a0a; border-color: #1a1a1a; color: #a0aec0; }
          .reports-table { border-color: #1a1a1a; }
          .reports-table th { background: #0a0a0a; color: #4a5568; }
          .reports-table td { border-top-color: #1a1a1a; color: #a0aec0; }
          .page-btn { background: #0a0a0a; border-color: #1a1a1a; color: #a0aec0; }
        }
      `}} />
      <h1 className="admin-page-title">Reports Queue</h1>
      <p className="admin-page-subtitle">Review and manage content reports ({total} total)</p>

      <div className="reports-filters">
        {['', 'PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'].map((s) => (
          <button
            key={s || 'all'}
            className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
            onClick={() => { setStatusFilter(s); setPage(1); }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#718096', padding: 40 }}>Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="empty-reports">
          <div className="empty-icon">🎉</div>
          <p>No reports found</p>
        </div>
      ) : (
        <>
          <table className="reports-table">
            <thead>
              <tr>
                <th>Reporter</th>
                <th>Target</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700 }}>@{r.reporter.username}</td>
                  <td>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{r.targetType}</span>
                    <br />
                    <span style={{ fontSize: '0.75rem', color: '#a0aec0' }}>{r.targetId.slice(0, 8)}...</span>
                  </td>
                  <td>{r.reason}{r.details && <><br /><span style={{ fontSize: '0.78rem', color: '#a0aec0' }}>{r.details.slice(0, 80)}</span></>}</td>
                  <td>{getStatusBadge(r.status)}</td>
                  <td style={{ fontSize: '0.82rem', color: '#a0aec0' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    {r.status === 'PENDING' || r.status === 'REVIEWING' ? (
                      <>
                        <button
                          className="action-btn resolve"
                          onClick={() => handleResolve(r.id, 'RESOLVED')}
                          disabled={actionLoading === r.id}
                        >
                          ✓ Resolve
                        </button>
                        <button
                          className="action-btn dismiss"
                          onClick={() => handleResolve(r.id, 'DISMISSED')}
                          disabled={actionLoading === r.id}
                        >
                          ✕ Dismiss
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#a0aec0' }}>
                        {r.assignedTo ? `By @${r.assignedTo.username}` : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>← Prev</button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next →</button>
          </div>
        </>
      )}
    </>
  );
}
