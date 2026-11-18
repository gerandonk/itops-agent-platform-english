import type { Provider, ProviderResult } from './types';

/**
 * Prometheus Provider
 */
export const prometheusProvider: Provider = {
  name: 'prometheus',
  description: 'Prometheus Monitoring Provider',
  version: '1.0.0',
  methods: [
    {
      name: 'query',
      description: 'Execute PromQL query',
      inputs: [
        { name: 'url', type: 'string', description: 'Prometheus Address', required: true },
        { name: 'query', type: 'string', description: 'PromQL Query Statement', required: true },
        { name: 'time', type: 'number', description: 'Query Timestamp' },
        { name: 'timeout', type: 'number', description: 'Timeout (ms)' }
      ],
      outputs: [
        { name: 'result', type: 'any' },
        { name: 'status', type: 'string' }
      ],
      examples: [
        {
          title: 'Query CPU utilization',
          inputs: {
            url: 'http://localhost:9090',
            query: '100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'
          }
        }
      ]
    },
    {
      name: 'queryRange',
      description: 'Execute range query',
      inputs: [
        { name: 'url', type: 'string', description: 'Prometheus Address', required: true },
        { name: 'query', type: 'string', description: 'PromQL Query Statement', required: true },
        { name: 'start', type: 'number', description: 'Start Timestamp', required: true },
        { name: 'end', type: 'number', description: 'End Timestamp', required: true },
        { name: 'step', type: 'string', description: 'Step, e.g., 15s, 1m, 5m', required: true }
      ],
      outputs: [
        { name: 'result', type: 'any' },
        { name: 'status', type: 'string' }
      ],
      examples: []
    },
    {
      name: 'alerts',
      description: 'Get alert info',
      inputs: [
        { name: 'url', type: 'string', description: 'Prometheus Address', required: true }
      ],
      outputs: [
        { name: 'alerts', type: 'array' },
        { name: 'status', type: 'string' }
      ],
      examples: []
    }
  ]
};

// Prometheus 方法实现
export const prometheusMethods = {
  async query(params: Record<string, unknown>): Promise<ProviderResult> {
    try {
      let url = `${params.url}/api/v1/query?query=${encodeURIComponent(params.query as string)}`;
      if (params.time) {
        url += `&time=${params.time}`;
      }

      const response = await fetch(url as string, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json() as Record<string, unknown>;

      return {
        success: data.status === 'success',
        data: {
          result: data.data,
          status: data.status
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  async queryRange(params: Record<string, unknown>): Promise<ProviderResult> {
    try {
      const url = `${params.url}/api/v1/query_range?query=${encodeURIComponent(params.query as string)}&start=${params.start}&end=${params.end}&step=${params.step}`;
      const response = await fetch(url as string, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json() as Record<string, unknown>;

      return {
        success: data.status === 'success',
        data: {
          result: data.data,
          status: data.status
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  async alerts(params: Record<string, unknown>): Promise<ProviderResult> {
    try {
      const response = await fetch(`${params.url}/api/v1/alerts` as string);
      const data = await response.json() as Record<string, unknown>;

      return {
        success: data.status === 'success',
        data: {
          alerts: (data.data as Record<string, unknown>)?.alerts,
          status: data.status
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};