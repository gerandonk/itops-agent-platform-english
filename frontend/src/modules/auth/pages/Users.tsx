/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2, UserPlus } from 'lucide-react';
import clsx from 'clsx';
import api from '../../../lib/api';
import { getAxiosErrorMessage } from '../../../lib/errorHandler';
import { useToast } from '../../../contexts/ToastContext';
import type { UserRecord } from '../api';

export default function Users() {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: 'viewer',
    enabled: true,
  });
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data as UserRecord[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const { data: result } = await api.post('/users', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      resetForm();
      toast.success('User created');
    },
    onError: (err: unknown) => {
      toast.error(getAxiosErrorMessage(err, 'User creation failed'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { data: result } = await api.put(`/users/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      resetForm();
      toast.success('User updated');
    },
    onError: (err: unknown) => {
      toast.error(getAxiosErrorMessage(err, 'User update failed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/users/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
    },
    onError: (err: unknown) => {
      toast.error(getAxiosErrorMessage(err, 'User deletion failed'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const { password, ...dataWithoutPassword } = formData;
      if (password) {
        updateMutation.mutate({ id: editingUser.id, data: formData });
      } else {
        updateMutation.mutate({ id: editingUser.id, data: dataWithoutPassword });
      }
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (user: UserRecord) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      email: user.email || '',
      role: user.role,
      enabled: !!user.enabled,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      email: '',
      role: 'viewer',
      enabled: true,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getRoleBadge = (role: string) => {
    const roles = {
      admin: { label: 'Admin', class: 'bg-red-500/10 text-red-500' },
      operator: { label: 'Ops', class: 'bg-blue-500/10 text-blue-500' },
      viewer: { label: 'Read-only', class: 'bg-green-500/10 text-green-500' },
    };
    return roles[role as keyof typeof roles] || { label: role, class: 'bg-text-secondary/10 text-text-secondary' };
  };

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
            <p className="text-text-secondary">Manage system users and permissions</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            New User
          </button>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Username</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Created At</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usersLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                      Loading...
                    </td>
                  </tr>
                ) : usersData?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                      No users
                    </td>
                  </tr>
                ) : (
                  usersData?.map((user) => (
                    <tr key={user.id} className="hover:bg-background transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-text-primary">{user.username}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {user.email || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx("px-2 py-1 rounded-full text-xs font-medium", getRoleBadge(user.role).class)}>
                          {getRoleBadge(user.role).label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          user.enabled ? 'bg-green-500/10 text-green-500' : 'bg-text-secondary/10 text-text-secondary'
                        )}>
                          {user.enabled ? 'Enable' : 'Disable'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 hover:bg-background rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(user.id)}
                            disabled={deleteMutation.isPending}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-border max-w-lg w-full">
            <div className="p-4 border-b border-border flex items-center justify-between flex-wrap">
              <h3 className="text-lg font-semibold text-text-primary">
                {editingUser ? 'Edit user' : 'New user'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-background rounded"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Password {editingUser && '(leave blank to keep unchanged)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                  placeholder="Enter password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="admin">Admin - Has all permissions</option>
                  <option value="operator">Operations - Can perform actions and manage</option>
                  <option value="viewer">Read-only - View only</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <label htmlFor="enabled" className="text-sm text-text-secondary">Enable User</label>
              </div>
              <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                <p className="text-sm text-yellow-500">
                  Note: Admin users have full access to the system. Assign this role with care.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-background border border-border rounded-lg text-text-primary hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
