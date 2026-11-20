/**
 * useServerActions handlers + tag utils 子模块（2026-07-21 拆分）
 *
 * 包含：
 * - Tag 工具 4 个 useCallback（parseCurrentTags / getLastTagFragment / addTagToInput / removeTag）
 * - filteredTagSuggestions（基于 above 派生）
 * - 15 个 handle* 业务函数（提交、编辑、AI 生成、采集等）
 */

import { useCallback } from 'react';
import type { Server } from '../types';
import type { ApiError } from './types';

interface ServerActionsHandlers {
  parseCurrentTags: () => string[];
  getLastTagFragment: () => string;
  addTagToInput: (tag: string) => void;
  removeTag: (tag: string) => void;
  filteredTagSuggestions: () => string[];
  handleSubmit: (e: React.FormEvent) => void;
  handleEdit: (server: Server) => void;
  handleTestConnection: (server: Server) => void;
  handleExecuteCommand: () => void;
  handleRunCompliance: (server: Server) => void;
  startComplianceCheck: () => void;
  handleCollectInfo: (server: Server) => Promise<void>;
  handleAiGenerateCommand: () => Promise<void>;
  handleExecuteAiCommand: () => void;
  confirmExecuteAiCommand: () => void;
  handleCollectAll: () => Promise<void>;
  handleCollectMetrics: (server: Server) => Promise<void>;
  handleCollectAllMetrics: () => Promise<void>;
  handleGroupSubmit: (e: React.FormEvent) => void;
  handleImport: () => Promise<void>;
  openAiCommandForServer: (server: Server) => void;
}

export function useServerActionsHandlers(
  // state
  formData: any,
  setFormData: (v: any) => void,
  setSelectedServer: (v: Server | null) => void,
  setSshKeySearchQuery: (v: string) => void,
  setSelectedSshKeyId: (v: string) => void,
  setIsModalOpen: (v: boolean) => void,
  setSelectedAiAgent: (v: { id: string; name: string } | null) => void,
  setIsAiCommandModalOpen: (v: boolean) => void,
  setIsGenerating: (v: boolean) => void,
  setAiGeneratedCommand: (v: string) => void,
  setAiCommandExplanation: (v: string) => void,
  setAiPrompt: (v: string) => void,
  setShowAiCommandConfirm: (v: boolean) => void,
  setAiGenerationError: (v: string) => void,
  setShowComplianceOptions: (v: boolean) => void,
  setIsRunningCompliance: (v: boolean) => void,
  setComplianceResults: (v: any) => void,
  setActiveTab: (v: any) => void,
  setIsExecuting: (v: boolean) => void,
  setCommandResult: (v: any) => void,
  setCommand: (v: string) => void,
  setIsCollecting: (v: boolean) => void,
  setIsCollectingMetrics: (v: boolean) => void,
  setImportData: (v: string) => void,
  setImportResult: (v: any) => void,
  setAiCommandServer: (v: Server | null) => void,
  setTagDropdownOpen: (v: boolean) => void,
  // refs
  tagInputRef: React.RefObject<HTMLInputElement>,
  // queries
  agents: any[] | undefined,
  sshKeys: any[] | undefined,
  allTags: string[],
  // mutations
  createMutation: any,
  updateMutation: any,
  testConnectionMutation: any,
  executeCommandMutation: any,
  runComplianceMutation: any,
  collectInfoMutation: any,
  collectAllMutation: any,
  collectMetricsMutation: any,
  collectAllMetricsMutation: any,
  importServersMutation: any,
  createGroupMutation: any,
  updateGroupMutation: any,
  // derived state
  selectedServer: Server | null,
  complianceOptions: { useAI: boolean; concurrency: number },
  aiCommandServer: Server | null,
  aiPrompt: string,
  aiGeneratedCommand: string,
  command: string,
  isExecuting: boolean,
  selectedAiAgent: { id: string; name: string } | null,
  editingGroup: any,
  groupFormData: any,
  importData: string,
  // toast
  toast: any,
  // external api
  api: any,
): ServerActionsHandlers {
  const parseCurrentTags = useCallback(() => {
    return formData.tags
      ? formData.tags
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean)
      : [];
  }, [formData.tags]);

  const getLastTagFragment = useCallback(() => {
    const raw = formData.tags;
    const lastCommaIndex = raw.lastIndexOf(',');
    return lastCommaIndex >= 0 ? raw.substring(lastCommaIndex + 1).trim() : (raw || '').trim();
  }, [formData.tags]);

  const addTagToInput = useCallback(
    (tag: string) => {
      const raw = formData.tags;
      const lastCommaIndex = raw.lastIndexOf(',');
      const beforeLast = lastCommaIndex >= 0 ? raw.substring(0, lastCommaIndex + 1) : '';
      setFormData({ ...formData, tags: beforeLast + tag + ', ' });
      tagInputRef.current?.focus();
    },
    [formData, setFormData, tagInputRef],
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      const current = parseCurrentTags();
      const filtered = current.filter((t: string) => t !== tagToRemove);
      setFormData({ ...formData, tags: filtered.join(', ') });
    },
    [formData, setFormData, parseCurrentTags],
  );

  const filteredTagSuggestions = useCallback(() => {
    const current = parseCurrentTags();
    const fragment = getLastTagFragment().toLowerCase();
    return allTags.filter((tag: string) => {
      if (current.includes(tag)) return false;
      if (fragment) return tag.toLowerCase().includes(fragment);
      return true;
    });
  }, [allTags, parseCurrentTags, getLastTagFragment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServer) {
      updateMutation.mutate({ id: selectedServer.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (server: Server) => {
    setSelectedServer(server);
    const serverSshKeyId = server.ssh_key_id || '';
    setSelectedSshKeyId(serverSshKeyId);

    if (serverSshKeyId && sshKeys) {
      const key = sshKeys.find((k: any) => k.id === serverSshKeyId);
      if (key) {
        setSshKeySearchQuery(`${key.name} (${key.key_type})`);
      }
    } else {
      setSshKeySearchQuery('');
    }

    setFormData({
      name: server.name,
      hostname: server.hostname,
      port: server.port,
      username: server.username,
      password: '',
      private_key: '',
      use_ssh_key: !!server.use_ssh_key,
      description: server.description || '',
      tags: server.tags ? server.tags.join(', ') : '',
      os_type: server.os_type === 'windows' ? 'windows' : 'linux',
      vnc_port: server.vnc_port || 5900,
      vnc_password: '',
    });
    setIsModalOpen(true);
  };

  const handleTestConnection = (server: Server) => {
    testConnectionMutation.mutate(server.id, {
      onSuccess: (data: any) => {
        toast.success(data.message);
      },
    });
  };

  const handleExecuteCommand = () => {
    if (!selectedServer || !command) return;
    setIsExecuting(true);
    executeCommandMutation.mutate(
      { id: selectedServer.id, command },
      {
        onSuccess: (data: any) => {
          setCommandResult(data);
        },
        onSettled: () => {
          setIsExecuting(false);
        },
      },
    );
  };

  const handleRunCompliance = (server: Server) => {
    setSelectedServer(server);
    setShowComplianceOptions(true);
  };

  const startComplianceCheck = () => {
    if (!selectedServer) return;
    setShowComplianceOptions(false);
    setIsRunningCompliance(true);
    setActiveTab('compliance');
    runComplianceMutation.mutate(
      { id: selectedServer.id, options: complianceOptions },
      {
        onSuccess: (data: any) => {
          setComplianceResults(data);
        },
        onSettled: () => {
          setIsRunningCompliance(false);
        },
      },
    );
  };

  const handleCollectInfo = async (server: Server) => {
    setIsCollecting(true);
    try {
      await collectInfoMutation.mutateAsync(server.id);
      toast.success(`Host info updated for \${server.name}`);
    } catch {
      toast.error('Collection failed');
    } finally {
      setIsCollecting(false);
    }
  };

  const handleAiGenerateCommand = async () => {
    if (!aiCommandServer || !aiPrompt.trim()) return;

    const enabledAgent = selectedAiAgent;
    if (!enabledAgent) {
      setAiGenerationError('No AI Agent available; create and enable one on the Agent management page first');
      return;
    }

    setAiGenerationError('');
    setIsGenerating(true);
    try {
      const serverInfo = {
        os_name: (aiCommandServer as any).os || 'Unknown',
        os_type: (aiCommandServer as any).os_type || 'linux',
        hostname: aiCommandServer.hostname || '',
        ip_address: (aiCommandServer as any).ip_address || '',
        cpu_cores: (aiCommandServer as any).cpu_cores || '',
        memory_gb: (aiCommandServer as any).memory_gb || '',
        disk_gb: (aiCommandServer as any).disk_gb || '',
      };

      const userInput = `Target server info:
OS Name: ${serverInfo.os_name}
OS Type: ${serverInfo.os_type}
Hostname/IP: ${serverInfo.hostname || serverInfo.ip_address}
${serverInfo.cpu_cores ? `CPU cores: \${serverInfo.cpu_cores}` : ''}
${serverInfo.memory_gb ? `Memory: \${serverInfo.memory_gb}GB` : ''}
${serverInfo.disk_gb ? `Disk: \${serverInfo.disk_gb}GB` : ''}

User Requirement: ${aiPrompt}`;

      const res = await api.post(`/agents/${enabledAgent.id}/test`, {
        input: userInput,
        serverIds: [aiCommandServer.id],
      });

      const output = res.data.output;
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]);
          setAiGeneratedCommand(result.command);
          setAiCommandExplanation(result.explanation);
        } catch {
          setAiGeneratedCommand(output);
          setAiCommandExplanation('AI-generated command, confirm before executing');
        }
      } else {
        setAiGeneratedCommand(output);
        setAiCommandExplanation('AI-generated command, confirm before executing');
      }
    } catch (err) {
      const errorMsg =
        (err as ApiError).response?.data?.error ||
        (err as ApiError).response?.data?.message ||
        (err as ApiError).message ||
        'Unknown error';
      setAiGenerationError(`Generation failed: \${errorMsg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExecuteAiCommand = () => {
    if (!aiCommandServer || !aiGeneratedCommand) return;
    setShowAiCommandConfirm(true);
  };

  const confirmExecuteAiCommand = () => {
    setShowAiCommandConfirm(false);
    setIsAiCommandModalOpen(false);
    setAiGeneratedCommand('');
    setAiCommandExplanation('');
    setAiPrompt('');
    setActiveTab('servers');
    setSelectedServer(aiCommandServer);
    setCommand(aiGeneratedCommand);
    setCommandResult(null);

    setIsExecuting(true);
    executeCommandMutation.mutate(
      { id: aiCommandServer!.id, command: aiGeneratedCommand },
      {
        onSuccess: (data: any) => {
          setCommandResult(data);
        },
        onSettled: () => {
          setIsExecuting(false);
        },
      },
    );
  };

  const handleCollectAll = async () => {
    setIsCollecting(true);
    try {
      const result = await collectAllMutation.mutateAsync();
      toast.success(`Collection complete: \${result.success} succeeded, \${result.failed} failed`);
    } catch {
      toast.error('Batch collection failed');
    } finally {
      setIsCollecting(false);
    }
  };

  const handleCollectMetrics = async (server: Server) => {
    setIsCollectingMetrics(true);
    try {
      await collectMetricsMutation.mutateAsync(server.id);
      toast.success(`Performance metrics collected for \${server.name}`);
    } catch {
      toast.error('Collection failed');
    } finally {
      setIsCollectingMetrics(false);
    }
  };

  const handleCollectAllMetrics = async () => {
    setIsCollectingMetrics(true);
    try {
      const result = await collectAllMetricsMutation.mutateAsync();
      toast.success(`Metrics collection complete: \${result.success} succeeded, \${result.failed} failed`);
    } catch {
      toast.error('Batch collection failed');
    } finally {
      setIsCollectingMetrics(false);
    }
  };

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, data: groupFormData });
    } else {
      createGroupMutation.mutate(groupFormData);
    }
  };

  const handleImport = async () => {
    try {
      const servers = importData
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          try {
            const item = JSON.parse(line);
            return {
              name: item.name,
              hostname: item.hostname,
              port: item.port || 22,
              username: item.username,
              password: item.password,
              private_key: item.private_key,
              use_ssh_key: item.use_ssh_key || 0,
              description: item.description || '',
              tags: item.tags ? item.tags.split(',').map((t: string) => t.trim()) : [],
              group_id: item.group_id || undefined,
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      if (servers.length === 0) {
        toast.error('No valid server data; please check the JSON format');
        return;
      }

      const result = await importServersMutation.mutateAsync({
        servers: servers as any,
        test_connection: true,
      });
      setImportResult(result.data);
      toast.success(`Import complete: \${result.success} succeeded, \${result.failed} failed`);
    } catch (err) {
      toast.error((err as ApiError).response?.data?.error || 'Import failed');
    }
  };

  const openAiCommandForServer = (server: Server) => {
    setAiCommandServer(server);
    setAiPrompt('');
    setAiGeneratedCommand('');
    setAiCommandExplanation('');
    setAiGenerationError('');
    setShowAiCommandConfirm(false);
    if (agents) {
      const cmdAgent = (agents as any[]).find(
        (a: any) =>
          a.enabled === 1 && (a.name?.includes('Command generation') || a.category?.includes('Command generation')),
      );
      const serverAgent = (agents as any[]).find(
        (a: any) =>
          a.enabled === 1 &&
          (a.category?.includes('Server') || a.name?.includes('Command') || a.name?.includes('Service')),
      );
      const firstAgent = (agents as any[]).find((a: any) => a.enabled === 1);
      setSelectedAiAgent(cmdAgent || serverAgent || firstAgent || null);
    }
    setIsAiCommandModalOpen(true);
  };

  return {
    parseCurrentTags,
    getLastTagFragment,
    addTagToInput,
    removeTag,
    filteredTagSuggestions,
    handleSubmit,
    handleEdit,
    handleTestConnection,
    handleExecuteCommand,
    handleRunCompliance,
    startComplianceCheck,
    handleCollectInfo,
    handleAiGenerateCommand,
    handleExecuteAiCommand,
    confirmExecuteAiCommand,
    handleCollectAll,
    handleCollectMetrics,
    handleCollectAllMetrics,
    handleGroupSubmit,
    handleImport,
    openAiCommandForServer,
  };
}
