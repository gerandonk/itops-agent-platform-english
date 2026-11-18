import { z } from 'zod';
import { type RegisteredTool, RiskLevel } from '../types';
import { textResult, jsonResult, READONLY } from './shared';
import { alertConfigsRepo } from '../../../../repositories';

export const monitorTools: RegisteredTool[] = [
  {
    name: 'alert.list',
    title: 'Query Alert List',
    description: 'Query alert list in the alert center, supporting filtering by severity level, status, and time range. Returns read-only alert facts.',
    domain: 'alert_handling',
    annotations: READONLY,
    inputSchema: z.object({
      severity: z.enum(['critical', 'warning', 'info']).optional().describe('Alert Severity'),
      status: z.enum(['active', 'acknowledged', 'resolved']).optional().describe('Alert Status'),
      limit: z.number().min(1).max(100).default(20).describe('Limit / Return Count'),
      offset: z.number().min(0).default(0).describe('Offset'),
    }),
    handler: async (args) => {
      try {
        const alerts = alertConfigsRepo.listNotifications({
          level: args.severity,
          status: args.status,
          limit: args.limit || 20,
          offset: args.offset || 0,
        });
        return jsonResult(alerts, `Found ${alerts?.length || 0} alerts`);
      } catch (err) {
        return textResult(`Failed to query alerts: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'alert.analyze',
    title: 'Analyze Alert Root Cause',
    description: 'Perform AI root cause analysis (RCA) on the specified alert, returning analysis conclusions, basis, and suggested actions.',
    domain: 'alert_handling',
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      riskLevel: RiskLevel.LOW,
      requiresApproval: false,
    },
    inputSchema: z.object({
      alertId: z.string().describe('Alert ID'),
      includeMetrics: z.boolean().default(false).describe('Include Correlated Metrics'),
    }),
    handler: async (args, _ctx) => {
      try {
        const { rootCauseAnalysisService } = await import(
          '../../../../modules/ai/services/rca/rootCauseAnalysisService'
        );
        const result = await rootCauseAnalysisService.analyze(args.alertId as string);
        return jsonResult(result, 'Alert root cause analysis completed');
      } catch (err) {
        return textResult(`Root cause analysis failed: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'alert.correlate',
    title: 'Alert Correlation Analysis',
    description: 'Query other alerts correlated with the specified alert to discover potential relationships.',
    domain: 'alert_handling',
    annotations: READONLY,
    inputSchema: z.object({
      alertId: z.string().describe('Alert ID'),
      timeWindowMinutes: z.number().min(5).max(1440).default(60).describe('Time Window (minutes)'),
      limit: z.number().min(1).max(50).default(10).describe('Limit / Return Count'),
    }),
    handler: async (args) => {
      try {
        const { alertCorrelationService } = await import(
          '../../../../modules/alerts/services/alertCorrelationService'
        );
        const correlated = (alertCorrelationService as any).findCorrelated
          ? (alertCorrelationService as any).findCorrelated(args.alertId, args.timeWindowMinutes)
          : { message: 'Alert correlation service is initializing', alerts: [] };
        return jsonResult(correlated, 'Alert correlation analysis completed');
      } catch (err) {
        return textResult(`Correlation analysis failed: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'monitor.health',
    title: 'Query System Health',
    description: 'Query overall system health status, including health check results of various services and resource usage.',
    domain: 'system_inspection',
    annotations: READONLY,
    inputSchema: z.object({}),
    handler: async () => {
      try {
        const { healthService } = await import('../../../../modules/monitor/services/healthService');
        const health = await healthService.checkHealth();
        return jsonResult(health, `System Health Status: ${health.status}`);
      } catch (err) {
        return textResult(`Failed to query health status: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'monitor.metrics',
    title: 'Query System Metrics',
    description: 'Query system runtime metrics (CPU, memory, disk, network), supporting time range.',
    domain: 'system_inspection',
    annotations: READONLY,
    inputSchema: z.object({
      metricType: z.enum(['cpu', 'memory', 'disk', 'network']).optional().describe('Metric Type'),
      hostId: z.string().optional().describe('Host ID'),
      minutes: z.number().min(5).max(1440).default(15).describe('Time Range (minutes)'),
    }),
    handler: async (args) => {
      try {
        const { selfMonitorService } = await import(
          '../../../../modules/monitor/services/selfMonitorService'
        );
        const report = selfMonitorService.getLastReport();
        return jsonResult(
          { report, query: args },
          report ? 'System Metrics (Latest Check)' : 'Monitoring data is initializing'
        );
      } catch (err) {
        return textResult(`Failed to query metrics: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },
];