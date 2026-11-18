import type { Provider, ProviderResult } from './types';

/**
 * Elasticsearch Provider
 */
export const elasticsearchProvider: Provider = {
  name: 'elasticsearch',
  description: 'Elasticsearch Search Provider',
  version: '1.0.0',
  methods: [
    {
      name: 'search',
      description: 'Execute search query',
      inputs: [
        { name: 'url', type: 'string', description: 'Elasticsearch Address', required: true },
        { name: 'index', type: 'string', description: 'Index Name', required: true },
        { name: 'query', type: 'object', description: 'DSL Query Object', required: true },
        { name: 'size', type: 'number', description: 'Limit / Return Count' },
        { name: 'from', type: 'number', description: 'From / Offset' }
      ],
      outputs: [
        { name: 'hits', type: 'any' },
        { name: 'total', type: 'number' },
        { name: 'took', type: 'number' }
      ],
      examples: [
        {
          title: 'Search error logs',
          inputs: {
            url: 'http://localhost:9200',
            index: 'logs-*',
            query: { bool: { must: [{ match: { level: 'error' } }] } }
          }
        }
      ]
    },
    {
      name: 'index',
      description: 'Index Document',
      inputs: [
        { name: 'url', type: 'string', description: 'Elasticsearch Address', required: true },
        { name: 'index', type: 'string', description: 'Index Name', required: true },
        { name: 'document', type: 'object', description: 'Document Content', required: true },
        { name: 'id', type: 'string', description: 'Document ID' }
      ],
      outputs: [
        { name: 'result', type: 'string' },
        { name: 'id', type: 'string' }
      ],
      examples: []
    },
    {
      name: 'count',
      description: 'Count documents',
      inputs: [
        { name: 'url', type: 'string', description: 'Elasticsearch Address', required: true },
        { name: 'index', type: 'string', description: 'Index Name', required: true },
        { name: 'query', type: 'object', description: 'Filter Conditions' }
      ],
      outputs: [
        { name: 'count', type: 'number' }
      ],
      examples: []
    }
  ]
};

// Elasticsearch 方法实现
export const elasticsearchMethods = {
  async search(params: Record<string, unknown>): Promise<ProviderResult> {
    try {
      const url = `${params.url}/${params.index}/_search`;
      const body: Record<string, unknown> = { query: params.query };
      if (params.size) body.size = params.size;
      if (params.from !== undefined) body.from = params.from;

      const response = await fetch(url as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json() as Record<string, unknown>;

      return {
        success: true,
        data: {
          hits: data.hits,
          total: (data.hits as Record<string, unknown>)?.total,
          took: data.took
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  async index(params: Record<string, unknown>): Promise<ProviderResult> {
    try {
      let url = `${params.url}/${params.index}/_doc`;
      if (params.id) url += `/${params.id}`;

      const response = await fetch(url as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params.document)
      });
      const data = await response.json() as Record<string, unknown>;

      return {
        success: true,
        data: {
          result: data.result,
          id: data._id
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  async count(params: Record<string, unknown>): Promise<ProviderResult> {
    try {
      const url = `${params.url}/${params.index}/_count`;
      const body = params.query ? { query: params.query } : undefined;

      const response = await fetch(url as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await response.json() as Record<string, unknown>;

      return {
        success: true,
        data: {
          count: data.count
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