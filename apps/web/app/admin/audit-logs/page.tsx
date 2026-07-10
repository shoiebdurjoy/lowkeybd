'use client';

import React, { useEffect, useState } from 'react';

interface AuditLogItem {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: string; username: string; role: string } | null;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (actionFilter) params.set('action', actionFilter);

        const res = await fetch(`http://localhost:3001/api/v1/admin/audit-logs?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch audit logs');
        const data = await res.json();
        setLogs(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page, actionFilter]);

  const getActionColor = (action: string) => {
    if (action.includes('BAN')) return '#E53E3E';
    if (action.includes('UNBAN')) return '#38A169';
    if (action.includes('ROLE')) return '#805AD5';
    if (action.includes('REPORT')) return '#DD6B20';
    if (action.includes('MODERATION')) return '#D69E2E';
    if (action.includes('FEATURE')) return '#3182CE';
    return '#718096';
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-page-title { font-size: 1.6rem; font-weight: 900; color: #1a202c; margin: 0 0 8px 0; }
        .admin-page-subtitle { font-size: 0.92rem; color: #718096; margin-bottom: 24px; }

        .audit-filter-input {
          padding: 8px 16px; border-radius: 8px; border: 1px solid #e2e8f0;
          font-size: 0.88rem; width: 260px; outline: none; margin-bottom: 24px;
        }
        .audit-filter-input:focus { border-color: #FF416C; box-shadow: 0 0 0 3px rgba(255, 65, 108, 0.1); }

        .audit-timeline { display: flex; flex-direction: column; gap: 2px; }

        .audit-entry {
          display: flex; gap: 16px; padding: 16px 20px;
          border-left: 3px solid #e2e8f0; transition: all 0.15s;
        }
        .audit-entry:hover {
          background: rgba(255, 65, 108, 0.02);
          border-left-color: #FF416C;
        }

        .audit-time {
          min-width: 140px; font-size: 0.78rem; color: #a0aec0; font-weight: 600;
          padding-top: 2px;
        }

        .audit-body { flex: 1; }
        .audit-action {
          font-size: 0.82rem; font-weight: 800; padding: 2px 8px;
          border-radius: 4px; display: inline-block; margin-bottom: 6px;
        }
        .audit-details {
          font-size: 0.82rem; color: #718096;
        }
        .audit-actor {
          font-size: 0.78rem; color: #a0aec0; margin-top: 4px;
        }
        .audit-meta {
          font-size: 0.72rem; color: #a0aec0; margin-top: 6px;
          background: #f8fafc; padding: 6px 10px; border-radius: 6px;
          font-family: monospace; word-break: break-all;
        }

        .pagination { display: flex; gap: 8px; align-items: center; margin-top: 24px; justify-content: center; }
        .page-btn {
          padding: 8px 14px; border-radius: 8px; border: 1px solid #e2e8f0;
          background: white; font-weight: 700; font-size: 0.82rem; cursor: pointer;
        }
        .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .page-info { font-size: 0.85rem; color: #718096; font-weight: 600; }

        .dark {
          .admin-page-title { color: #e2e8f0; }
          .audit-filter-input { background: #0a0a0a; border-color: #1a1a1a; color: white; }
          .audit-entry { border-left-color: #1a1a1a; }
          .audit-entry:hover { background: rgba(255, 65, 108, 0.04); }
          .audit-meta { background: #0a0a0a; }
          .page-btn { background: #0a0a0a; border-color: #1a1a1a; color: #a0aec0; }
        }
      `}} />
      <h1 className="admin-page-title">Audit Logs</h1>
      <p className="admin-page-subtitle">{total} total entries</p>

      <input
        type="text"
        className="audit-filter-input"
        placeholder="Filter by action (e.g. USER_BANNED)..."
        value={actionFilter}
        onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
      />

      {loading ? (
        <div style={{ color: '#718096', padding: 40 }}>Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#a0aec0' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
          <p style={{ fontWeight: 700 }}>No audit logs found</p>
        </div>
      ) : (
        <>
          <div className="audit-timeline">
            {logs.map((log) => (
              <div key={log.id} className="audit-entry">
                <div className="audit-time">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
                <div className="audit-body">
                  <span
                    className="audit-action"
                    style={{ color: getActionColor(log.action), background: `${getActionColor(log.action)}15` }}
                  >
                    {log.action}
                  </span>
                  <div className="audit-details">
                    {log.entityType} → <code style={{ fontSize: '0.75rem' }}>{log.entityId.slice(0, 12)}...</code>
                  </div>
                  <div className="audit-actor">
                    {log.actor ? `By @${log.actor.username} (${log.actor.role})` : 'System'}
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="audit-meta">
                      {JSON.stringify(log.metadata, null, 0)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
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
