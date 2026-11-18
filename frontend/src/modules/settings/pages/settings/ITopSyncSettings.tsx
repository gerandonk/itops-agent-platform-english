/**
 * iTop CMDB 同步配置页面
 *
 * 作为"System Settings"的一个 tab，提供：
 *   1. iTop 连接配置（API 地址、认证、同步开关、间隔）
 *   2. 测试连接
 *   3. 同步状态面板（各 CI 类型的同步时间/数量）
 *   4. 手动触发同步
 *   5. 同步日志列表
 *
 * 后端端点: /api/v1/cmdb-sync/*
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Database, Loader2, CheckCircle2, AlertCircle, Wifi, RefreshCw,
  Clock, Activity, Server, HardDrive, MapPin, Zap,
} from 'lucide-react';
import clsx from 'clsx';
import api from '../../../../lib/api';
import { getAxiosErrorMessage } from '../../../../lib/errorHandler';
import SyncLogTable, { type SyncLog } from './SyncLogTable';

// ============================================================
// 类型
// ============================================================

interface ITopConfig {
  apiBase: string;
  authUser: string;
  syncEnabled: boolean;
  syncIntervalMinutes: number;
  timeoutMs: number;
  sslVerify: boolean;
  tokenConfigured: boolean;
}

interface SyncStateEntry {
  ci_type: string;
  direction: string;
  last_sync_at: string | null;
  last_sync_duration_ms: number | null;
  last_count: number;
  last_status: string;
  last_error: string | null;
}

interface SyncStatus {
  states: SyncStateEntry[];
  syncing: boolean;
}

interface SyncResult {
  success: boolean;
  batchId: string;
  durationMs: number;
  message: string;
  summary: Record<string, { pulled: number; created: number; updated: number; errors: number }>;
}

// ============================================================
// 常量
// ============================================================

const initialConfig: ITopConfig = {
  apiBase: '',
  authUser: 'admin',
  syncEnabled: false,
  syncIntervalMinutes: 30,
  timeoutMs: 30000,
  sslVerify: false,
  tokenConfigured: false,
};

const CI_TYPE_ICONS: Record<string, typeof Server> = {
  Location: MapPin,
  Rack: Database,
  Server: Server,
  DatacenterDevice: Zap,
};

// ============================================================
// 主组件
// ============================================================

export default function ITopSyncSettings() {
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<ITopConfig>(initialConfig);
  const [authToken, setAuthToken] = useState(''); // 单独管理 token 输入
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [syncMessage, setSyncMessage] = useState('');

  // --- 加载配置（queryFn 只负责取数，setState 通过 useEffect 同步，避免覆盖用户输入）---
  const { data: remoteConfig } = useQuery<ITopConfig>({
    queryKey: ['itopConfig'],
    queryFn: async () => {
      const { data } = await api.get('/cmdb-sync/config');
      return data as ITopConfig;
    },
  });

  // 远端配置到达后，同步到本地表单 state（仅首次加载或远端变更时触发）
  useEffect(() => {
    if (remoteConfig) setConfig(remoteConfig);
  }, [remoteConfig]);

  // --- 加载同步状态 ---
  const { data: syncStatus, refetch: refetchStatus } = useQuery<SyncStatus>({
    queryKey: ['itopSyncStatus'],
    queryFn: async () => {
      const { data } = await api.get('/cmdb-sync/status');
      return data as SyncStatus;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // --- 加载日志 ---
  const { data: syncLogs } = useQuery<SyncLog[]>({
    queryKey: ['itopSyncLogs'],
    queryFn: async () => {
      const { data } = await api.get('/cmdb-sync/logs', { params: { limit: 30 } });
      return data as SyncLog[];
    },
    refetchInterval: 15000,
  });

  // --- 保存配置 ---
  const configMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        apiBase: config.apiBase,
        authUser: config.authUser,
        syncEnabled: config.syncEnabled,
        syncIntervalMinutes: config.syncIntervalMinutes,
        timeoutMs: config.timeoutMs,
        sslVerify: config.sslVerify,
      };
      if (authToken) payload.authToken = authToken;
      const { data } = await api.put('/cmdb-sync/config', payload);
      return data;
    },
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itopConfig'] });
      setSaveStatus('saved');
      setAuthToken(''); // 清空 token 输入框
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: (err: unknown) => {
      setSaveStatus('error');
      setTestMessage(getAxiosErrorMessage(err, 'Failed to save'));
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
  });

  // --- 测试连接 ---
  const testMutation = useMutation({
    mutationFn: async () => {
      // 如果正在输入新配置，用临时配置测试
      const payload: Record<string, unknown> = {};
      if (config.apiBase) payload.apiBase = config.apiBase;
      if (config.authUser) payload.authUser = config.authUser;
      if (authToken) payload.authToken = authToken;
      payload.sslVerify = config.sslVerify;
      const { data } = await api.post('/cmdb-sync/config/test', payload);
      return data;
    },
    onMutate: () => {
      setTestStatus('testing');
      setTestMessage('');
    },
    onSuccess: (data: { success: boolean; message: string }) => {
      setTestStatus(data.success ? 'success' : 'error');
      setTestMessage(data.message);
    },
    onError: (err: unknown) => {
      setTestStatus('error');
      setTestMessage(getAxiosErrorMessage(err, 'Connection failed'));
    },
  });

  // --- 手动触发同步 ---
  const triggerMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/cmdb-sync/trigger');
      return data as SyncResult;
    },
    onMutate: () => setSyncMessage(''),
    onSuccess: (data) => {
      setSyncMessage(data.message);
      queryClient.invalidateQueries({ queryKey: ['itopSyncStatus'] });
      queryClient.invalidateQueries({ queryKey: ['itopSyncLogs'] });
      refetchStatus();
    },
    onError: (err: unknown) => {
      setSyncMessage(getAxiosErrorMessage(err, 'Sync failed'));
    },
  });

  // --- Handlers ---
  const handleTest = () => {
    if (!config.apiBase.trim()) {
      setTestStatus('error');
      setTestMessage('Please fill in the iTop API address first');
      setTimeout(() => setTestStatus('idle'), 3000);
      return;
    }
    testMutation.mutate();
  };

  const handleSave = () => {
    if (config.syncEnabled && !config.apiBase.trim()) {
      setSaveStatus('error');
      setTestMessage('Please fill in the API address before enabling sync');
      setTestStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }
    configMutation.mutate();
  };

  // ============================================================
  // 渲染
  // ============================================================

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center gap-2">
          <Database className="w-5 h-5" />
          iTop CMDB Synchronization
        </h3>
        <p className="text-sm text-text-secondary">
          Connect with iTop CMDB system to automatically synchronize asset information for server rooms, racks, servers, and network devices
        </p>
      </div>

      {/* === Configuration Area === */}
      <div className="bg-background rounded-lg p-5 border border-border space-y-4">
        {/* API Address */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            iTop API Address <span className="text-status-failed">*</span>
          </label>
          <input
            type="text"
            value={config.apiBase}
            onChange={(e) => setConfig({ ...config, apiBase: e.target.value })}
            placeholder="http://itop.example.com/webservices/rest.php"
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p className="text-xs text-text-tertiary mt-1">
            Full URL of iTop REST/JSON API (usually ending with /webservices/rest.php)
          </p>
        </div>

        {/* Authentication User */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Auth User
            </label>
            <input
              type="text"
              value={config.authUser}
              onChange={(e) => setConfig({ ...config, authUser: e.target.value })}
              placeholder="admin"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Auth Token */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Auth Password / Token{' '}
              {config.tokenConfigured && (
                <span className="text-xs text-status-success ml-1">✓ Configured</span>
              )}
            </label>
            <input
              type="password"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder={config.tokenConfigured ? '•••••• (saved; enter a new value to replace)' : 'Enter iTop login password or Token'}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Sync Switch + Interval */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Auto Sync
            </label>
            <div className="flex items-center gap-3 py-2">
              <button
                type="button"
                onClick={() => setConfig({ ...config, syncEnabled: !config.syncEnabled })}
                className={clsx(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  config.syncEnabled ? 'bg-primary' : 'bg-border',
                )}
              >
                <span
                  className={clsx(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    config.syncEnabled ? 'translate-x-6' : 'translate-x-1',
                  )}
                />
              </button>
              <span className="text-sm text-text-secondary">
                {config.syncEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Sync Interval (Minutes)
            </label>
            <input
              type="number"
              min={5}
              max={1440}
              value={config.syncIntervalMinutes}
              onChange={(e) => setConfig({ ...config, syncIntervalMinutes: parseInt(e.target.value) || 30 })}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* SSL Verification + Timeout */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              SSL Certificate Verification
            </label>
            <div className="flex items-center gap-3 py-2">
              <button
                type="button"
                onClick={() => setConfig({ ...config, sslVerify: !config.sslVerify })}
                className={clsx(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  config.sslVerify ? 'bg-primary' : 'bg-border',
                )}
              >
                <span
                  className={clsx(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    config.sslVerify ? 'translate-x-6' : 'translate-x-1',
                  )}
                />
              </button>
              <span className="text-sm text-text-secondary">
                {config.sslVerify ? 'Strict validation' : 'No validation (intranet self-signed)'}
              </span>
            </div>
            <p className="text-xs text-text-tertiary mt-1">
              Must be disabled when iTop uses internal CA/self-signed certificates (default)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Request Timeout (ms)
            </label>
            <input
              type="number"
              min={1000}
              max={300000}
              value={config.timeoutMs}
              onChange={(e) => setConfig({ ...config, timeoutMs: parseInt(e.target.value) || 30000 })}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          {/* Test Connection */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleTest}
              disabled={testStatus === 'testing'}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-lg hover:bg-background disabled:opacity-50 transition-colors"
            >
              {testStatus === 'testing' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : testStatus === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-status-success" />
              ) : testStatus === 'error' ? (
                <AlertCircle className="w-4 h-4 text-status-failed" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
              Test Connection
            </button>
            {testMessage && (
              <span
                className={clsx(
                  'text-xs',
                  testStatus === 'success' ? 'text-status-success' : 'text-status-failed',
                )}
              >
                {testMessage}
              </span>
            )}
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
            {saveStatus === 'saved' ? 'Saved ✓' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* === Sync Status Panel === */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-text-secondary" />
            <h4 className="text-sm font-semibold text-text-primary">Sync Status</h4>
            {syncStatus?.syncing && (
              <span className="inline-flex items-center gap-1 text-xs text-primary">
                <Loader2 className="w-3 h-3 animate-spin" />
                Syncing...
              </span>
            )}
          </div>

          {/* Manual Trigger */}
          <button
            onClick={() => triggerMutation.mutate()}
            disabled={triggerMutation.isPending || syncStatus?.syncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 disabled:opacity-50 transition-colors"
          >
            {triggerMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Manual Sync
          </button>
        </div>

        {/* Sync Result Message */}
        {syncMessage && (
          <div
            className={clsx(
              'px-5 py-2 text-xs border-b border-border',
              triggerMutation.isSuccess ? 'bg-status-success/10 text-status-success' : 'bg-status-failed/10 text-status-failed',
            )}
          >
            {syncMessage}
          </div>
        )}

        {/* CI Type Status List */}
        <div className="divide-y divide-border">
          {(syncStatus?.states ?? []).length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-text-tertiary">
              暂无同步记录，点击"Manual Sync"Start
            </div>
          ) : (
            (syncStatus?.states ?? []).map((state) => {
              const Icon = CI_TYPE_ICONS[state.ci_type] ?? HardDrive;
              return (
                <div key={state.ci_type} className="flex items-center gap-4 px-5 py-3">
                  <div
                    className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      state.last_status === 'success'
                        ? 'bg-status-success/10'
                        : state.last_status === 'error'
                          ? 'bg-status-failed/10'
                          : 'bg-background',
                    )}
                  >
                    <Icon className="w-4 h-4 text-text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary">{state.ci_type}</div>
                    <div className="text-xs text-text-tertiary">
                      {state.last_sync_at ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(state.last_sync_at).toLocaleString('en-US')}
                          {state.last_sync_duration_ms !== null && ` · ${state.last_sync_duration_ms}ms`}
                        </span>
                      ) : (
                        'Not Synced'
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-text-primary">{state.last_count}</div>
                    <div className="text-xs text-text-tertiary">records</div>
                  </div>
                  <div
                    className={clsx(
                      'px-2 py-0.5 text-xs font-medium rounded-full',
                      state.last_status === 'success'
                        ? 'bg-status-success/10 text-status-success'
                        : state.last_status === 'error'
                          ? 'bg-status-failed/10 text-status-failed'
                          : state.last_status === 'partial'
                            ? 'bg-yellow-500/10 text-yellow-600'
                            : 'bg-background text-text-tertiary',
                    )}
                  >
                    {state.last_status}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* === Sync Logs === */}
      <SyncLogTable logs={syncLogs} />
    </div>
  );
}
