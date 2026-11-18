import { useState } from 'react';
import { LineChart, Play, Plug, ChevronDown, ChevronUp } from 'lucide-react';
import { message } from 'antd';
import api from '../../../lib/api';
import { getAxiosErrorMessage } from '../../../lib/errorHandler';
import { logger } from '../../../lib/logger';
import { buildRequestBody, unwrapResponse } from './prometheus/format';
import { ResultsTable } from './prometheus/ResultsTable';
import type { AuthConfig, PromResponse, QueryMode } from './prometheus/types';

export default function PrometheusQuery() {
  const [auth, setAuth] = useState<AuthConfig>({
    url: 'http://localhost:9090',
    username: '',
    password: '',
    bearerToken: '',
    timeoutMs: '10000',
  });
  const [mode, setMode] = useState<QueryMode>('instant');
  const [promql, setPromql] = useState<string>('up');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [step, setStep] = useState<string>('15s');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [response, setResponse] = useState<PromResponse | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateAuth = (key: keyof AuthConfig, value: string) => {
    setAuth((prev) => ({ ...prev, [key]: value }));
  };

  const handleTest = async () => {
    if (!auth.url.trim()) {
      message.warning('Please enter Prometheus URL');
      return;
    }
    setTesting(true);
    try {
      const body = buildRequestBody(auth, 'up');
      const { data } = await api.post('/monitor/prometheus/test', body);
      const ok = (data as { success?: boolean; message?: string } | undefined);
      message.success(ok?.message || 'Connected');
    } catch (err) {
      const msg = getAxiosErrorMessage(err, 'Connection failed');
      message.error(msg);
      logger.error('[PrometheusQuery] test failed:', err);
    } finally {
      setTesting(false);
    }
  };

  const handleQuery = async () => {
    if (!auth.url.trim()) {
      message.warning('Please enter Prometheus URL');
      return;
    }
    if (!promql.trim()) {
      message.warning('Please enter PromQL');
      return;
    }
    if (mode === 'range' && (!start || !end || !step)) {
      message.warning('Range mode requires start/end time and step');
      return;
    }

    setLoading(true);
    try {
      const extras = mode === 'range' ? { start, end, step } : undefined;
      const body = buildRequestBody(auth, promql.trim(), extras);
      const endpoint = mode === 'range'
        ? '/monitor/prometheus/query-range'
        : '/monitor/prometheus/query';
      const { data } = await api.post(endpoint, body);
      const payload = unwrapResponse(data) as PromResponse;
      setResponse(payload);
      if (payload.status === 'success') {
        const count = payload.data?.result?.length ?? 0;
        message.success(`Query successful, \${count} results found`);
      } else {
        message.error(payload.error || 'Query failed');
      }
    } catch (err) {
      const msg = getAxiosErrorMessage(err, 'Query failed');
      message.error(msg);
      setResponse({ status: 'error', error: msg });
      logger.error('[PrometheusQuery] query failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="space-y-4">
        {/* 标题 */}
        <div className="flex items-center gap-3">
          <LineChart className="w-7 h-7 text-orange-400" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Prometheus Query</h1>
            <p className="text-text-secondary text-sm">Actively query metrics from remote Prometheus instances</p>
          </div>
        </div>

        {/* 连接配置 */}
        <section className="bg-surface rounded-xl p-5 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Plug className="w-4 h-4 text-primary" />
              Connection Configuration
            </h2>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 disabled:opacity-50 transition-colors"
            >
              {testing ? (
                <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <Plug className="w-3.5 h-3.5" />
              )}
              Test Connection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-text-secondary mb-1">Prometheus URL *</label>
              <input
                type="text"
                value={auth.url}
                onChange={(e) => updateAuth('url', e.target.value)}
                placeholder="http://prometheus:9090"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text-primary text-sm font-mono focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Basic Auth Username</label>
              <input
                type="text"
                value={auth.username}
                onChange={(e) => updateAuth('username', e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text-primary text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Basic Auth Password</label>
              <input
                type="password"
                value={auth.password}
                onChange={(e) => updateAuth('password', e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text-primary text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showAdvanced ? 'Collapse' : 'Expand'}Advanced Options (Bearer Token / Timeout)
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Bearer Token</label>
                <input
                  type="text"
                  value={auth.bearerToken}
                  onChange={(e) => updateAuth('bearerToken', e.target.value)}
                  placeholder="Optional, choose one with Basic Auth"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text-primary text-sm font-mono focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Timeout (ms)</label>
                <input
                  type="number"
                  value={auth.timeoutMs}
                  onChange={(e) => updateAuth('timeoutMs', e.target.value)}
                  min={0}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text-primary text-sm focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          )}
        </section>

        {/* PromQL 查询 */}
        <section className="bg-surface rounded-xl p-5 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">PromQL</h2>
            <div className="flex items-center gap-1 bg-background rounded-lg p-0.5 border border-border">
              {(['instant', 'range'] as QueryMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    mode === m ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {m === 'instant' ? 'Instant' : 'Range'}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={promql}
            onChange={(e) => setPromql(e.target.value)}
            rows={3}
            placeholder="e.g., rate(node_cpu_seconds_total[5m])"
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text-primary text-sm font-mono focus:outline-none focus:border-primary/50 resize-y"
          />

          {mode === 'range' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Start Time (RFC3339 or unix timestamp)</label>
                <input
                  type="text"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  placeholder="2026-07-06T00:00:00Z"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text-primary text-sm font-mono focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">End Time</label>
                <input
                  type="text"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  placeholder="now or RFC3339"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text-primary text-sm font-mono focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Step</label>
                <input
                  type="text"
                  value={step}
                  onChange={(e) => setStep(e.target.value)}
                  placeholder="15s / 1m / 1h"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text-primary text-sm font-mono focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleQuery}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Query
            </button>
          </div>
        </section>

        {/* 结果 */}
        <section className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Query Results</h2>
            {response?.data?.resultType && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                {response.data.resultType}
              </span>
            )}
          </div>
          <ResultsTable loading={loading} response={response} />
        </section>
      </div>
    </div>
  );
}