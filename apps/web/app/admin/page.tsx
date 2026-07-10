'use client';

import React, { useEffect, useState } from 'react';

interface Overview {
  totalUsers: number;
  totalPosts: number;
  totalCommunities: number;
  totalComments: number;
  pendingReports: number;
  totalReports: number;
  activeRestrictions: number;
}

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('http://localhost:3001/api/v1/admin/overview', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch overview');
        const data = await res.json();
        setOverview(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) return <div style={{ color: '#718096', padding: 40 }}>Loading dashboard...</div>;
  if (error) return <div style={{ color: '#e53e3e', padding: 40 }}>Error: {error}</div>;
  if (!overview) return null;

  const metrics = [
    { label: 'Total Users', value: overview.totalUsers, icon: '👥', color: '#3182ce' },
    { label: 'Total Posts', value: overview.totalPosts, icon: '📝', color: '#38a169' },
    { label: 'Communities', value: overview.totalCommunities, icon: '🏢', color: '#805ad5' },
    { label: 'Comments', value: overview.totalComments, icon: '💬', color: '#d69e2e' },
    { label: 'Pending Reports', value: overview.pendingReports, icon: '🚩', color: '#e53e3e' },
    { label: 'Total Reports', value: overview.totalReports, icon: '📊', color: '#dd6b20' },
    { label: 'Active Restrictions', value: overview.activeRestrictions, icon: '🔒', color: '#718096' },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-page-title {
          font-size: 1.6rem;
          font-weight: 900;
          color: #1a202c;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }

        .admin-page-subtitle {
          font-size: 0.92rem;
          color: #718096;
          margin-bottom: 32px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }

        .metric-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 24px;
          transition: all 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        }

        .metric-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .metric-icon {
          font-size: 1.8rem;
        }

        .metric-label {
          font-size: 0.82rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #a0aec0;
        }

        .metric-value {
          font-size: 2.2rem;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .dark {
          .admin-page-title { color: #e2e8f0; }
          .admin-page-subtitle { color: #a0aec0; }
          .metric-card {
            background: #0a0a0a;
            border-color: #1a1a1a;
          }
          .metric-card:hover {
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          }
          .metric-label { color: #4a5568; }
        }
      `}} />
      <h1 className="admin-page-title">Admin Dashboard</h1>
      <p className="admin-page-subtitle">Platform overview and key metrics</p>

      <div className="metrics-grid">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card">
            <div className="metric-header">
              <span className="metric-label">{m.label}</span>
              <span className="metric-icon">{m.icon}</span>
            </div>
            <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>
    </>
  );
}
