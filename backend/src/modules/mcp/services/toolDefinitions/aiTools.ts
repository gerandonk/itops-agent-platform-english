import { z } from 'zod';
import { type RegisteredTool } from '../types';
import { textResult, jsonResult, READONLY } from './shared';
import { remediationPolicyRepository } from '../../../../repositories';
import { remediationAuditRepository } from '../../../../repositories';
import { knowledgeRepository } from '../../../../repositories';
import { chatSessionRepository } from '../../../../repositories';

export const aiTools: RegisteredTool[] = [
  {
    name: 'remediation.policy.list',
    title: 'Query remediation policies',
    description: 'Query automated remediation policy list, including matching conditions, remediation actions, and execution history.',
    domain: 'change_execution',
    annotations: READONLY,
    inputSchema: z.object({
      enabled: z.boolean().optional().describe('Is Enabled'),
      limit: z.number().min(1).max(50).default(20).describe('Limit / Return Count'),
    }),
    handler: async (args) => {
      try {
        const policies = remediationPolicyRepository.listForMcp(
          args.enabled !== undefined ? (args.enabled ? 1 : 0) : undefined,
          args.limit || 20
        );
        return jsonResult(policies, `Found ${policies.length} remediation policies`);
      } catch (err) {
        return textResult(`Failed to query remediation policies: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'remediation.audit',
    title: 'Query remediation audits',
    description: 'Query execution audit records of automated remediation, including triggering alerts, remediation actions, and execution results.',
    domain: 'change_execution',
    annotations: READONLY,
    inputSchema: z.object({
      status: z.enum(['success', 'failed', 'pending', 'rollback']).optional().describe('Execution Status'),
      limit: z.number().min(1).max(100).default(20).describe('Limit / Return Count'),
    }),
    handler: async (args) => {
      try {
        const { audits } = remediationAuditRepository.listWithJoins({
          status: args.status,
          limit: args.limit || 20,
        });
        return jsonResult(audits, `Found ${audits?.length || 0} remediation audit records`);
      } catch (err) {
        return textResult(`Failed to query remediation audits: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'aiops.knowledge',
    title: 'Query AIOps Knowledge Graph',
    description: 'Query IT Ops knowledge graph, search historical troubleshooting experience and best practices by environment, system, or service.',
    domain: 'document_generation',
    annotations: READONLY,
    inputSchema: z.object({
      query: z.string().describe('Search Keywords'),
      category: z.string().optional().describe('Knowledge Category'),
      limit: z.number().min(1).max(20).default(5).describe('Limit / Return Count'),
    }),
    handler: async (args) => {
      try {
        const results = knowledgeRepository.searchMcp({
          query: args.query,
          category: args.category,
          limit: args.limit || 5,
        });
        return jsonResult(results, `Found ${results?.length || 0} knowledge items`);
      } catch (err) {
        return textResult(`Failed to query knowledge graph: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'aiops.session.list',
    title: 'Query AI session list',
    description: 'Query AI agent session history, including user questions, agent answers, and tool call statistics.',
    domain: 'document_generation',
    annotations: READONLY,
    inputSchema: z.object({
      status: z.enum(['active', 'completed', 'failed']).optional().describe('Session Status'),
      limit: z.number().min(1).max(50).default(10).describe('Limit / Return Count'),
    }),
    handler: async (args) => {
      try {
        const sessions = chatSessionRepository.listWithMessageCount({
          status: args.status,
          limit: args.limit || 10,
        });
        return jsonResult(sessions, `Found ${(sessions as unknown[]).length} sessions`);
      } catch (err) {
        return textResult(`Failed to query sessions: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },
];