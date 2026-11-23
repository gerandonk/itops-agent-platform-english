import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle, XCircle, Filter, Search, Clock, RotateCw, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { message, Modal } from 'antd';
import api from '../../../lib/api';
import { getAxiosErrorMessage } from '@/lib/errorHandler';
import type { NotificationRecord } from '../api';

export default function Notifications() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', page, selectedType, selectedStatus],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit };
      if (selectedType) params.type = selectedType;
      if (selectedStatus) params.status = selectedStatus;
      
      const { data } = await api.get('/notifications', { params });
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['notificationStats'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/stats/summary');
      return data;
    },
  });

  const markAsSentMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/notifications/${id}/send`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationStats'] });
      message.success('Marked as sent');
    },
    onError: (err) => {
      message.error(getAxiosErrorMessage(err, 'Operation failed'));
    },
  });

  // 2026-07-06 增：单条重发
  const retryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/notifications/${id}/retry`);
      return data;
    },
    onSuccess: (data: { success: boolean; error?: string }) => {
      if (data.success) {
        message.success('Notification resent');
      } else {
        message.error(`Resend failed: ${data.error || 'Unknown error'}`);
      }
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationStats'] });
    },
    onError: (err) => {
      message.error(getAxiosErrorMessage(err, 'Resend failed'));
    },
  });

  const handleRetry = (n: NotificationRecord) => {
    Modal.confirm({
      title: 'Resend notification',
      content: `Resend notification "\${n.title}"?`,
      okText: 'Resend',
      cancelText: 'Cancel',
      onOk: () => retryMutation.mutate(n.id),
    });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationStats'] });
      message.success('Deleted');
    },
    onError: (err) => {
      message.error(getAxiosErrorMessage(err, 'Failed to delete'));
    },
  });

  const handleDelete = (n: NotificationRecord) => {
    Modal.confirm({
      title: 'Delete notification',
      content: `Delete notification "\${n.title}"? This cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteMutation.mutate(n.id),
    });
  };

  const filteredNotifications = notificationsData?.notifications?.filter((notif: NotificationRecord) =>
    !searchQuery || 
    notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notif.content?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const notificationTypes = Array.from(
    new Set((notificationsData?.notifications || []).map((n: NotificationRecord) => n.type))
  ) as string[];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'alert':
        return '🔔';
      case 'task':
        return '📋';
      case 'system':
        return '⚙️';
      case 'report':
        return '📊';
      default:
        return '📧';
    }
  };

  // 2026-07-06 增：状态徽章配置（支持 failed 状态）
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return { label: 'Sent', className: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> };
      case 'failed':
        return { label: 'Failed', className: 'bg-red-100 text-red-700', icon: <AlertCircle className="w-3 h-3" /> };
      case 'pending':
      default:
        return { label: 'Pending send', className: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3" /> };
    }
  };

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Notification System</h1>
            <p className="text-text-secondary">Manage system notifications and alert delivery</p>
          </div>
        </div>

        {/* Stat cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-center justify-between flex-wrap">
                <div>
                  <p className="text-sm text-text-secondary">Pending send</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats.pendingCount}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-center justify-between flex-wrap">
                <div>
                  <p className="text-sm text-text-secondary">Sent today</p>
                  <p className="text-2xl font-bold text-green-500">{stats.todaySent}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-center justify-between flex-wrap">
                <div>
                  <p className="text-sm text-text-secondary">Notification Type</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {Array.from(new Set((stats.typeStats || []).map((t: { type: string }) => t.type))).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Bell className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          {/* Filter Section */}
          <div className="p-4 border-b border-border bg-background">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-text-secondary" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="">All types</option>
                  {notificationTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending send</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification List */}
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-8 text-center text-text-secondary">
                Loading...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">
                No notifications
              </div>
            ) : (
              filteredNotifications.map((notification: NotificationRecord) => (
                <div key={notification.id} className="p-4 hover:bg-background transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-1">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-text-primary">{notification.title}</h3>
                          {(() => {
                            const badge = getStatusBadge(notification.status);
                            return (
                              <span className={clsx(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                                badge.className
                              )}>
                                {badge.icon}
                                {badge.label}
                              </span>
                            );
                          })()}
                        </div>
                        {notification.content && (
                          <p className="text-sm text-text-secondary mb-2">{notification.content}</p>
                        )}
                        {/* Added 2026-07-06: Failure Reason Display */}
                        {notification.status === 'failed' && notification.error_message && (
                          <div className="flex items-start gap-1.5 mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span className="font-mono break-all">{notification.error_message}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-text-tertiary">
                          <span>Created:  {formatDate(notification.created_at)}</span>
                          {notification.sent_at && (
                            <span>Send: {formatDate(notification.sent_at)}</span>
                          )}
                          {notification.recipient && (
                            <span>Recipient: {notification.recipient}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Added 2026-07-06: Failure Resend Button (allowed for status=failed or status=pending) */}
                      {(notification.status === 'failed' || notification.status === 'pending') && (
                        <button
                          onClick={() => handleRetry(notification)}
                          disabled={retryMutation.isPending}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Resend notification"
                        >
                          <RotateCw className="w-5 h-5" />
                        </button>
                      )}
                      {notification.status === 'pending' && (
                        <button
                          onClick={() => markAsSentMutation.mutate(notification.id)}
                          disabled={markAsSentMutation.isPending}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Mark as sent"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification)}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {notificationsData?.total > limit && (
            <div className="p-4 border-t border-border flex items-center justify-between flex-wrap">
              <p className="text-sm text-text-secondary">
                Total  {notificationsData.total} notifications
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded bg-background border border-border text-sm text-text-primary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous page
                </button>
                <span className="text-sm text-text-secondary">
                  Page {page} of {Math.ceil(notificationsData.total / limit)} 
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * limit >= notificationsData.total}
                  className="px-3 py-1 rounded bg-background border border-border text-sm text-text-primary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
