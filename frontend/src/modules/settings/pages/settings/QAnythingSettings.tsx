/**
 * QAnything 知识库配置
 *
 * 从原 infra/pages/settings/QAnythingSettings.tsx 抽离（2026-07-08 增量-12）。
 *
 * 注：本组件涉及 4 个后端端点（/knowledge/qanything/*），实际属于 ai 模块子域。
 * 这里保留在 settings 模块仅作为"系统设置 → 知识库"tab 的展示，未来可考虑迁移到 ai 模块。
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Globe, Loader2, CheckCircle2, AlertCircle, Upload, FileText, Wifi,
} from 'lucide-react';
import clsx from 'clsx';
import api from '../../../../lib/api';
import { getAxiosErrorMessage } from '../../../../lib/errorHandler';

interface QAnythingConfig {
  enabled: boolean;
  apiBase: string;
  apiKey: string;
  kbId: string;
  mode: 'cloud' | 'local';
  topK: number;
}

const initialConfig: QAnythingConfig = {
  enabled: false,
  apiBase: '',
  apiKey: '',
  kbId: '',
  mode: 'cloud',
  topK: 5,
};

export default function QAnythingSettings() {
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<QAnythingConfig>(initialConfig);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  useQuery({
    queryKey: ['qanythingConfig'],
    queryFn: async () => {
      const { data } = await api.get('/knowledge/qanything/config');
      if (data) {
        const backendData = data as QAnythingConfig;
        if (backendData.apiKey?.includes('****')) {
          backendData.apiKey = config.apiKey;
        }
        setConfig(backendData);
      }
      return data;
    },
  });

  const configMutation = useMutation({
    mutationFn: async (payload: QAnythingConfig) => {
      const { data } = await api.post('/knowledge/qanything/config', payload);
      return data;
    },
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qanythingConfig'] });
      setSaveStatus('saved');
      setTestMessage('Config saved');
      setTestStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
      setTimeout(() => setTestStatus('idle'), 3000);
    },
    onError: (err: unknown) => {
      setSaveStatus('error');
      setTestMessage(getAxiosErrorMessage(err, 'Failed to save'));
      setTestStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      setTimeout(() => setTestStatus('idle'), 5000);
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/knowledge/qanything/test');
      return data;
    },
    onMutate: () => {
      setTestStatus('testing');
      setTestMessage('');
    },
    onSuccess: (data) => {
      setTestStatus(data.success ? 'success' : 'error');
      setTestMessage(data.message);
    },
    onError: (err: unknown) => {
      setTestStatus('error');
      setTestMessage(getAxiosErrorMessage(err, 'Connection failed'));
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      const { data } = await api.post('/knowledge/qanything/upload-batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onMutate: () => {
      setUploadStatus('uploading');
      setUploadMessage('');
    },
    onSuccess: (data) => {
      setUploadStatus('success');
      setUploadMessage(`Uploaded \${data.summary?.success || 0} files successfully, \${data.summary?.failed || 0} failed`);
      setUploadFiles([]);
      setTimeout(() => setUploadStatus('idle'), 5000);
    },
    onError: (err: unknown) => {
      setUploadStatus('error');
      setUploadMessage(getAxiosErrorMessage(err, 'Upload failed'));
      setTimeout(() => setUploadStatus('idle'), 5000);
    },
  });

  const handleTest = () => {
    if (!config.apiBase.trim()) {
      setTestStatus('error');
      setTestMessage('Please fill in the API address first');
      setTimeout(() => setTestStatus('idle'), 3000);
      return;
    }
    testMutation.mutate();
  };

  const handleUpload = () => {
    if (!config.enabled) {
      setUploadStatus('error');
      setUploadMessage('Please enable QAnything knowledge base and save config first');
      setTimeout(() => setUploadStatus('idle'), 5000);
      return;
    }
    if (uploadFiles.length === 0) {
      setUploadStatus('error');
      setUploadMessage('Please select files to upload first');
      setTimeout(() => setUploadStatus('idle'), 3000);
      return;
    }
    uploadMutation.mutate(uploadFiles);
  };

  const handleSave = () => {
    if (config.enabled) {
      if (!config.apiBase.trim()) {
        setSaveStatus('error');
        setTestMessage('API address cannot be empty');
        setTestStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        setTimeout(() => setTestStatus('idle'), 3000);
        return;
      }
      if (!config.kbId.trim()) {
        setSaveStatus('error');
        setTestMessage('Knowledge base ID cannot be empty');
        setTestStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        setTimeout(() => setTestStatus('idle'), 3000);
        return;
      }
      if (config.mode === 'cloud' && !config.apiKey.trim()) {
        setSaveStatus('error');
        setTestMessage('API Key cannot be empty');
        setTestStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        setTimeout(() => setTestStatus('idle'), 3000);
        return;
      }
    }
    configMutation.mutate(config);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setUploadFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Knowledge Base Configuration (QAnything)
        </h3>
        <p className="text-sm text-text-secondary mb-6">
          Connect with QAnything knowledge base, support PDF/Word/Excel and other document formats upload, automatic parsing and used for Agent RAG.
        </p>
      </div>

      <div className="bg-background rounded-lg p-6">
        <h4 className="font-medium text-text-primary mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Connection Configuration
        </h4>

        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap">
            <div>
              <p className="text-sm font-medium text-text-primary">Enable QAnything knowledge base</p>
              <p className="text-xs text-text-secondary">When enabled, Agent execution prioritizes searching the QAnything knowledge base</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              />
              <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Deployment Mode</label>
            <div className="flex gap-3">
              <button
                onClick={() => setConfig({ ...config, mode: 'cloud' })}
                className={clsx(
                  'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                  config.mode === 'cloud'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-text-secondary border-border hover:border-primary/50'
                )}
              >️ Cloud API</button>
              <button
                onClick={() => setConfig({ ...config, mode: 'local' })}
                className={clsx(
                  'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                  config.mode === 'local'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-text-secondary border-border hover:border-primary/50'
                )}
              >Local Deployment</button>
            </div>
            <p className="text-xs text-text-secondary mt-2">
              {config.mode === 'cloud'
                ? 'Uses NetEase Youdao cloud QAnything API; external network access required'
                : 'Local Docker deployment, data stays on server, more secure'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">API URL</label>
            <input
              type="text"
              placeholder={config.mode === 'cloud' ? 'https://openapi.youdao.com/q_anything/api' : 'http://localhost:8777'}
              value={config.apiBase}
              onChange={(e) => setConfig({ ...config, apiBase: e.target.value })}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {config.mode === 'cloud' ? 'Management Key' : 'API Key'}
            </label>
            <input
              type="password"
              placeholder={config.mode === 'cloud' ? 'Get it from the QAnything admin console' : 'Usually not needed for local deployment'}
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Knowledge Base ID</label>
            <input
              type="text"
              placeholder="KBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx_xxxxxx"
              value={config.kbId}
              onChange={(e) => setConfig({ ...config, kbId: e.target.value })}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-text-secondary mt-1">Create a knowledge base in the QAnything admin console to get the ID</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Number of chunks returned per retrieval</label>
            <input
              type="number"
              min="1"
              max="20"
              value={config.topK}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 5;
                setConfig({ ...config, topK: Math.max(1, Math.min(20, val)) });
              }}
              className="w-32 px-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
            />
            <span className="text-xs text-text-secondary ml-2">Default 5, range 1-20</span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleTest}
              disabled={testStatus === 'testing'}
              className="px-4 py-2 bg-surface border border-border text-text-primary rounded-lg hover:bg-surface/80 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {testStatus === 'testing' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
              Test Connection
            </button>
            {testStatus === 'success' && (
              <span className="text-sm text-status-success flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />{testMessage}
              </span>
            )}
            {testStatus === 'error' && (
              <span className="text-sm text-status-failed flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />{testMessage}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between flex-wrap pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />}
              {saveStatus === 'saved' && (
                <p className="text-xs text-status-success flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />Saved
                </p>
              )}
              {saveStatus === 'error' && (
                <p className="text-xs text-status-failed flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />Save Failed
                </p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Configuration
            </button>
          </div>
        </div>
      </div>

      <div className="bg-background rounded-lg p-6">
        <h4 className="font-medium text-text-primary mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Document to Knowledge Base
        </h4>

        <div className="space-y-4">
          <div
            className={clsx(
              'border-2 border-dashed rounded-lg p-8 text-center transition-all',
              isDragOver ? 'border-primary bg-primary/5' : 'border-border'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FileText className="w-12 h-12 mx-auto text-text-secondary mb-3" />
            <p className="text-sm text-text-primary mb-1">Drag files here, or click to select files</p>
            <p className="text-xs text-text-secondary">Supports PDF/Word/Excel/PPT/Markdown/TXT/CSV/images</p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.md,.txt,.csv,.jpg,.jpeg,.png"
              onChange={(e) => {
                const files = e.target.files;
                if (files) {
                  setUploadFiles((prev) => [...prev, ...Array.from(files)]);
                  e.target.value = '';
                }
              }}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all cursor-pointer text-sm"
            >Select File</label>
          </div>

          {uploadFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-primary">Selected  {uploadFiles.length} files:</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {uploadFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between flex-wrap p-2 bg-surface rounded-lg">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-text-secondary flex-shrink-0" />
                      <span className="text-sm text-text-secondary truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-text-secondary">{formatFileSize(file.size)}</span>
                      <button
                        onClick={() => setUploadFiles((prev) => prev.filter((_, i) => i !== index))}
                        className="text-xs text-status-failed hover:text-status-failed/80 transition-colors"
                      >Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadStatus !== 'idle' && (
            <div className={clsx(
              'p-3 rounded-lg flex items-center gap-2',
              uploadStatus === 'uploading' && 'bg-blue-500/10 text-blue-400',
              uploadStatus === 'success' && 'bg-green-500/10 text-green-400',
              uploadStatus === 'error' && 'bg-red-500/10 text-red-400'
            )}>
              {uploadStatus === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploadStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {uploadStatus === 'error' && <AlertCircle className="w-4 h-4" />}
              <span className="text-sm">{uploadMessage}</span>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!config.enabled || uploadFiles.length === 0 || uploadStatus === 'uploading'}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploadStatus === 'uploading' ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Uploading...</>
            ) : (
              <><Upload className="w-4 h-4" />Upload to Knowledge Base</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
