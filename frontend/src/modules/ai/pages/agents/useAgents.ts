import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../../lib/api';
import type { Agent, Server, DbConnection } from './types';

const PRESET_INPUTS: Record<string, string> = {
  'Alert handling Agent': 'Server CPU usage abnormal, current value 92%, threshold 80%, please analyze and provide handling suggestions',
  'Alert handling': 'Server CPU usage abnormal, current value 92%, threshold 80%, please analyze and provide handling suggestions',
  'Fault diagnosis Agent': 'Application service response timeout, please diagnose possible causes and provide troubleshooting steps',
  'Fault diagnosis': 'Application service response timeout, please diagnose possible causes and provide troubleshooting steps',
  'Log analysis Agent': 'Multiple error records in system logs, please analyze and find the root cause',
  'Log analysis': 'Multiple error records in system logs, please analyze and find the root cause',
  'System inspection Agent': 'Please perform a system health check: CPU, memory, disk, and network status',
  'System Inspection': 'Please perform a system health check: CPU, memory, disk, and network status',
  'Change execution Agent': 'Please restart the Nginx service',
  'Change execution': 'Please restart the Nginx service',
  'Doc generation Agent': 'Please generate today\'s system operations report',
  'Doc generation': 'Please generate today\'s system operations report',
  'Compliance check Agent': 'Please perform a security compliance check to verify whether the system configuration meets security standards',
  'Compliance check': 'Please perform a security compliance check to verify whether the system configuration meets security standards',
  'Server command execution Agent': 'Please check server disk usage',
  'Server command execution': 'Please check server disk usage',
  'Auto inspection Agent': 'Please perform batch inspection on all servers',
  'Auto inspection': 'Please perform batch inspection on all servers',
  'Database ops Agent': 'Check database health status',
  'Database ops': 'Check database health status'
};

export function useAgents() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [testInput, setTestInput] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResult, setTestResult] = useState<{output: string, time: number} | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>([]);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>('');

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents', selectedCategory, searchQuery],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      const { data } = await api.get('/agents', { params });
      // v4 修复：api 拦截器已剥外层 data，这里 data 就是后端的 data 字段（即数组）
      // 原代码 `data?.items || []` 永远走兜底空数组，导致 useAgents 模式下完全不显示 agent
      return (Array.isArray(data) ? data : []) as Agent[];
    },
  });

  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const { data } = await api.get('/servers');
      return (Array.isArray(data) ? data : []) as Server[];
    },
  });

  const { data: dbConnections } = useQuery({
    queryKey: ['db-connections'],
    queryFn: async () => {
      const { data } = await api.get('/db-connections');
      return (Array.isArray(data) ? data : []) as DbConnection[];
    },
  });

  const categories = Array.from(new Set((agents || []).map(a => a.category).filter(Boolean) as string[]));

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/agents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: async ({ agentId, input, serverIds, databaseId }: { agentId: string, input: string, serverIds?: string[], databaseId?: string }) => {
      const payload: Record<string, unknown> = { input };
      if (serverIds && serverIds.length > 0) payload.serverIds = serverIds;
      if (databaseId) payload.databaseId = databaseId;
      const { data } = await api.post(`/agents/${agentId}/test`, payload);
      return data;
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete Agent "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingAgent(null);
    setShowModal(true);
  };

  const handleTest = (agent: Agent) => {
    setEditingAgent(agent);
    setTestResult(null);
    setShowTestModal(true);

    const isDbAgent = agent.name.includes('Database ops');

    if (isDbAgent) {
      setSelectedServerIds([]);
      const firstEnabled = dbConnections?.find((d) => d.enabled);
      if (firstEnabled) {
        setSelectedDatabaseId(firstEnabled.id);
      } else {
        setSelectedDatabaseId('');
      }
    } else {
      if (servers && servers.length > 0 && selectedServerIds.length === 0) {
        setSelectedServerIds(servers.filter((s) => s.enabled).map((s) => s.id));
      }
    }

    const defaultInput = PRESET_INPUTS[agent.name] || 'Describe the ops issue you want to handle';
    setTestInput(defaultInput);
  };

  const runTest = () => {
    if (!editingAgent || !testInput) return;
    setIsTesting(true);

    const isDbAgent = editingAgent.name.includes('Database ops');

    testMutation.mutate(
      {
        agentId: editingAgent.id,
        input: testInput,
        serverIds: isDbAgent ? undefined : (selectedServerIds.length > 0 ? selectedServerIds : undefined),
        databaseId: isDbAgent ? selectedDatabaseId : undefined
      },
      {
        onSuccess: (data) => {
          setTestResult({ output: data.output, time: data.executionTime });
          queryClient.invalidateQueries({ queryKey: ['agents'] });
        },
        onSettled: () => setIsTesting(false),
      }
    );
  };

  const filteredAgents = agents || [];

  return {
    // state
    showModal, setShowModal,
    editingAgent, setEditingAgent,
    selectedCategory, setSelectedCategory,
    searchQuery, setSearchQuery,
    showDetail, setShowDetail,
    testInput, setTestInput,
    showTestModal, setShowTestModal,
    testResult, setTestResult,
    isTesting,
    selectedServerIds, setSelectedServerIds,
    selectedDatabaseId, setSelectedDatabaseId,
    // data
    agents,
    isLoading,
    servers,
    dbConnections,
    categories,
    filteredAgents,
    // mutations
    deleteMutation,
    testMutation,
    // handlers
    handleDelete,
    handleEdit,
    handleNew,
    handleTest,
    runTest,
  };
}