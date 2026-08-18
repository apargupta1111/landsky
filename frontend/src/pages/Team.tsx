import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { fetchWithAuth } from '../utils/api';
import { UserCheck, UserX, User, ShieldAlert, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
const SERVER_IP = import.meta.env.VITE_SERVER_IP || 'http://localhost:5001';

interface PendingAccount {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  parent_email: string | null;
  created_at: string;
}

interface UserAccount {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string | null;
  created_at: string;
}

export function Team() {
  const token = useAppStore((s) => s.token);
  const [pending, setPending] = useState<PendingAccount[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch pending
      const pendingRes = await fetchWithAuth(`${SERVER_IP}/api/users/pending`);
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPending(pendingData);
      }
      
      // Fetch active users
      const usersRes = await fetchWithAuth(`${SERVER_IP}/api/users`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleApprove = async (id: number) => {
    try {
      const res = await fetchWithAuth(`${SERVER_IP}/api/users/approve/${id}`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Approval failed');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to approve');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Are you sure you want to reject this request?')) return;
    try {
      const res = await fetchWithAuth(`${SERVER_IP}/api/users/reject/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Rejection failed');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to reject');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to completely remove this active team member? This action cannot be undone.')) return;
    try {
      const res = await fetchWithAuth(`${SERVER_IP}/api/users/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Removal failed');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to remove team member');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage users, installers, and pending approvals.</p>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-6">
        <div className="flex items-center gap-3 text-warning mb-6">
          <div className="rounded-2xl bg-warning/10 p-3"><ShieldAlert className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-bold">Pending Approvals</div>
            <div className="text-xs text-[var(--text-secondary)]">Review access requests for your organization.</div>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-[var(--text-secondary)] animate-pulse">Loading requests...</div>
        ) : error ? (
          <div className="py-8 text-center text-error">{error}</div>
        ) : pending.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-secondary)]">
            <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No pending account requests at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[var(--text-primary)]">
                      {req.first_name} {req.last_name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] uppercase font-bold tracking-wider">
                      {req.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {req.email}</div>
                    <div>Requested: {new Date(req.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(req.id)}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-error/10 text-error hover:bg-error/20 transition-colors text-sm font-bold"
                  >
                    <UserX className="w-4 h-4" /> Reject
                  </button>
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-success/10 text-success hover:bg-success/20 transition-colors text-sm font-bold"
                  >
                    <UserCheck className="w-4 h-4" /> Approve
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-6 mt-8">
        <div className="flex items-center gap-3 text-primary mb-6">
          <div className="rounded-2xl bg-primary/10 p-3"><UserCheck className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-bold">Active Team Members</div>
            <div className="text-xs text-[var(--text-secondary)]">Current members in your organization.</div>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-[var(--text-secondary)] animate-pulse">Loading users...</div>
        ) : error ? (
          <div className="py-8 text-center text-error">{error}</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-secondary)]">
            <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No active team members found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[var(--text-primary)]">
                      {user.first_name || user.username || 'Unknown'} {user.last_name || ''}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-[10px] uppercase font-bold tracking-wider">
                      {user.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</div>
                    <div>Joined: {new Date(user.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-error/10 text-error hover:bg-error/20 transition-colors text-sm font-bold"
                  >
                    <UserX className="w-4 h-4" /> Remove
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
