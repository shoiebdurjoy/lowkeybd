'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface UserItem {
  id: string;
  email: string;
  username: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  profile: { reputationScore: number; contributionCount: number; avatarUrl: string | null } | null;
  restrictions: Array<{ id: string; type: string; reason: string; createdAt: string }>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (appliedSearch) params.set('search', appliedSearch);
      if (roleFilter) params.set('role', roleFilter);

      const res = await fetch(`http://localhost:3001/api/v1/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, appliedSearch]);

  useEffect(() => {
    setLoading(true);
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`http://localhost:3001/api/v1/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      await fetchUsers();
    } catch (err) {
      console.error('Error updating role:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanToggle = async (userId: string, isBanned: boolean) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`http://localhost:3001/api/v1/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ banned: !isBanned, banReason: isBanned ? undefined : 'Banned by admin' }),
      });
      await fetchUsers();
    } catch (err) {
      console.error('Error toggling ban:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      ADMIN: { bg: '#FED7E2', color: '#B83280' },
      MODERATOR: { bg: '#E9D8FD', color: '#6B46C1' },
      USER: { bg: '#EDF2F7', color: '#718096' },
    };
    const c = colors[role] ?? { bg: '#EDF2F7', color: '#718096' };
    return (
      <span style={{
        background: c.bg, color: c.color, padding: '3px 8px',
        borderRadius: 6, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
      }}>
        {role}
      </span>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-page-title { font-size: 1.6rem; font-weight: 900; color: #1a202c; margin: 0 0 8px 0; }
        .admin-page-subtitle { font-size: 0.92rem; color: #718096; margin-bottom: 24px; }

        .users-controls {
          display: flex; gap: 12px; margin-bottom: 24px; align-items: center; flex-wrap: wrap;
        }

        .search-form { display: flex; gap: 8px; }
        .search-input {
          padding: 8px 16px; border-radius: 8px; border: 1px solid #e2e8f0;
          font-size: 0.88rem; width: 240px; outline: none;
        }
        .search-input:focus { border-color: #FF416C; box-shadow: 0 0 0 3px rgba(255, 65, 108, 0.1); }
        .search-btn {
          padding: 8px 16px; border-radius: 8px; border: none;
          background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
          color: white; font-weight: 700; font-size: 0.82rem; cursor: pointer;
        }

        .role-select {
          padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0;
          font-size: 0.82rem; font-weight: 600; cursor: pointer; outline: none;
        }

        .users-table {
          width: 100%; border-collapse: separate; border-spacing: 0;
          border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;
        }
        .users-table th {
          background: #f8fafc; padding: 14px 16px; text-align: left;
          font-size: 0.78rem; font-weight: 800; color: #a0aec0;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .users-table td {
          padding: 14px 16px; border-top: 1px solid #f1f5f9;
          font-size: 0.88rem; color: #4a5568;
        }
        .users-table tr:hover td { background: rgba(255, 65, 108, 0.02); }

        .ban-btn {
          padding: 6px 12px; border-radius: 6px; border: none;
          font-weight: 700; font-size: 0.78rem; cursor: pointer; transition: all 0.15s;
        }
        .ban-btn.ban { background: #FFF5F5; color: #E53E3E; }
        .ban-btn.ban:hover { background: #FED7D7; }
        .ban-btn.unban { background: #F0FFF4; color: #38A169; }
        .ban-btn.unban:hover { background: #C6F6D5; }

        .role-change-select {
          padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0;
          font-size: 0.78rem; font-weight: 600; cursor: pointer;
        }

        .pagination { display: flex; gap: 8px; align-items: center; margin-top: 24px; justify-content: center; }
        .page-btn {
          padding: 8px 14px; border-radius: 8px; border: 1px solid #e2e8f0;
          background: white; font-weight: 700; font-size: 0.82rem; cursor: pointer;
        }
        .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .page-info { font-size: 0.85rem; color: #718096; font-weight: 600; }

        .ban-indicator {
          display: inline-flex; align-items: center; gap: 4px;
          background: #FFF5F5; color: #E53E3E; padding: 2px 8px;
          border-radius: 4px; font-size: 0.72rem; font-weight: 700;
        }

        .dark {
          .admin-page-title { color: #e2e8f0; }
          .search-input { background: #0a0a0a; border-color: #1a1a1a; color: white; }
          .role-select { background: #0a0a0a; border-color: #1a1a1a; color: #a0aec0; }
          .users-table { border-color: #1a1a1a; }
          .users-table th { background: #0a0a0a; color: #4a5568; }
          .users-table td { border-top-color: #1a1a1a; color: #a0aec0; }
          .role-change-select { background: #0a0a0a; border-color: #1a1a1a; color: #a0aec0; }
          .page-btn { background: #0a0a0a; border-color: #1a1a1a; color: #a0aec0; }
        }
      `}} />
      <h1 className="admin-page-title">User Management</h1>
      <p className="admin-page-subtitle">{total} total users</p>

      <div className="users-controls">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="search-btn">Search</button>
        </form>
        <select
          className="role-select"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Roles</option>
          <option value="USER">User</option>
          <option value="MODERATOR">Moderator</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {loading ? (
        <div style={{ color: '#718096', padding: 40 }}>Loading users...</div>
      ) : (
        <>
          <table className="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Reputation</th>
                <th>Verified</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isBanned = u.restrictions.some(r => r.type === 'ban');
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>@{u.username}</td>
                    <td style={{ fontSize: '0.82rem' }}>{u.email}</td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td style={{ fontWeight: 700 }}>{u.profile?.reputationScore ?? 0}</td>
                    <td>{u.isVerified ? '✅' : '❌'}</td>
                    <td>
                      {isBanned ? <span className="ban-indicator">🔒 Banned</span> : <span style={{ color: '#38A169', fontWeight: 700, fontSize: '0.78rem' }}>Active</span>}
                    </td>
                    <td style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select
                        className="role-change-select"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={actionLoading === u.id}
                      >
                        <option value="USER">User</option>
                        <option value="MODERATOR">Moderator</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button
                        className={`ban-btn ${isBanned ? 'unban' : 'ban'}`}
                        onClick={() => handleBanToggle(u.id, isBanned)}
                        disabled={actionLoading === u.id}
                      >
                        {isBanned ? '🔓 Unban' : '🔒 Ban'}
                      </button>
                    </td>
                  </tr>
                );
              })}
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
