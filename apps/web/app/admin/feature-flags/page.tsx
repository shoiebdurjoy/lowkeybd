'use client';

import React, { useEffect, useState } from 'react';

interface FeatureFlagItem {
  id: string;
  key: string;
  description: string | null;
  enabled: boolean;
  rolloutPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchFlags = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3001/api/v1/admin/feature-flags', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch feature flags');
      const data = await res.json();
      setFlags(data || []);
    } catch (err) {
      console.error('Error fetching flags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = async (key: string, currentEnabled: boolean) => {
    setActionLoading(key);
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`http://localhost:3001/api/v1/admin/feature-flags/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      await fetchFlags();
    } catch (err) {
      console.error('Error toggling flag:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRolloutChange = async (key: string, rollout: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`http://localhost:3001/api/v1/admin/feature-flags/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rolloutPercentage: rollout }),
      });
      await fetchFlags();
    } catch (err) {
      console.error('Error updating rollout:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    setCreating(true);
    try {
      const token = localStorage.getItem('accessToken');
      await fetch('http://localhost:3001/api/v1/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key: newKey.trim(), description: newDescription.trim() || undefined }),
      });
      setNewKey('');
      setNewDescription('');
      await fetchFlags();
    } catch (err) {
      console.error('Error creating flag:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-page-title { font-size: 1.6rem; font-weight: 900; color: #1a202c; margin: 0 0 8px 0; }
        .admin-page-subtitle { font-size: 0.92rem; color: #718096; margin-bottom: 24px; }

        .create-flag-form {
          display: flex; gap: 12px; margin-bottom: 32px; align-items: flex-end; flex-wrap: wrap;
          background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;
        }

        .create-flag-field { display: flex; flex-direction: column; gap: 4px; }
        .create-flag-field label {
          font-size: 0.75rem; font-weight: 800; color: #a0aec0; text-transform: uppercase;
        }
        .create-flag-field input {
          padding: 8px 14px; border-radius: 8px; border: 1px solid #e2e8f0;
          font-size: 0.88rem; outline: none;
        }
        .create-flag-field input:focus { border-color: #FF416C; }

        .create-flag-btn {
          padding: 8px 20px; border-radius: 8px; border: none;
          background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
          color: white; font-weight: 700; font-size: 0.85rem; cursor: pointer;
          height: 38px;
        }

        .flags-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px;
        }

        .flag-card {
          border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px;
          transition: all 0.2s;
        }
        .flag-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        }

        .flag-header {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
        }

        .flag-key {
          font-size: 0.95rem; font-weight: 800; color: #1a202c;
          font-family: monospace;
        }

        .flag-toggle {
          width: 48px; height: 26px; border-radius: 13px;
          border: none; cursor: pointer; position: relative;
          transition: all 0.2s;
        }
        .flag-toggle.on { background: #38A169; }
        .flag-toggle.off { background: #CBD5E0; }
        .flag-toggle::after {
          content: ''; position: absolute; top: 3px;
          width: 20px; height: 20px; border-radius: 50%;
          background: white; transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .flag-toggle.on::after { left: 25px; }
        .flag-toggle.off::after { left: 3px; }

        .flag-description {
          font-size: 0.82rem; color: #718096; margin-bottom: 16px; min-height: 20px;
        }

        .flag-rollout {
          display: flex; align-items: center; gap: 12px;
        }
        .flag-rollout label {
          font-size: 0.75rem; font-weight: 700; color: #a0aec0;
        }
        .rollout-slider {
          flex: 1; accent-color: #FF416C;
        }
        .rollout-value {
          font-size: 0.82rem; font-weight: 800; color: #4a5568; min-width: 40px; text-align: right;
        }

        .empty-flags {
          text-align: center; padding: 60px 0; color: #a0aec0;
        }

        @media (prefers-color-scheme: dark) {
          .admin-page-title { color: #e2e8f0; }
          .create-flag-form { background: #0a0a0a; border-color: #1a1a1a; }
          .create-flag-field label { color: #4a5568; }
          .create-flag-field input { background: #111; border-color: #1a1a1a; color: white; }
          .flag-card { border-color: #1a1a1a; }
          .flag-key { color: #e2e8f0; }
          .flag-description { color: #a0aec0; }
          .rollout-value { color: #a0aec0; }
        }
      `}} />
      <h1 className="admin-page-title">Feature Flags</h1>
      <p className="admin-page-subtitle">Manage platform feature toggles</p>

      <form className="create-flag-form" onSubmit={handleCreate}>
        <div className="create-flag-field">
          <label>Flag Key</label>
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="e.g. dark_mode_v2"
          />
        </div>
        <div className="create-flag-field">
          <label>Description</label>
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="What does this flag control?"
          />
        </div>
        <button type="submit" className="create-flag-btn" disabled={creating || !newKey.trim()}>
          {creating ? 'Creating...' : '+ Create Flag'}
        </button>
      </form>

      {loading ? (
        <div style={{ color: '#718096', padding: 40 }}>Loading feature flags...</div>
      ) : flags.length === 0 ? (
        <div className="empty-flags">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🏁</div>
          <p style={{ fontWeight: 700 }}>No feature flags yet</p>
        </div>
      ) : (
        <div className="flags-grid">
          {flags.map((flag) => (
            <div key={flag.id} className="flag-card">
              <div className="flag-header">
                <span className="flag-key">{flag.key}</span>
                <button
                  className={`flag-toggle ${flag.enabled ? 'on' : 'off'}`}
                  onClick={() => handleToggle(flag.key, flag.enabled)}
                  disabled={actionLoading === flag.key}
                  aria-label={`Toggle ${flag.key}`}
                />
              </div>
              <div className="flag-description">{flag.description || 'No description'}</div>
              <div className="flag-rollout">
                <label>Rollout:</label>
                <input
                  type="range"
                  className="rollout-slider"
                  min={0}
                  max={100}
                  value={flag.rolloutPercentage}
                  onChange={(e) => handleRolloutChange(flag.key, parseInt(e.target.value))}
                />
                <span className="rollout-value">{flag.rolloutPercentage}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
