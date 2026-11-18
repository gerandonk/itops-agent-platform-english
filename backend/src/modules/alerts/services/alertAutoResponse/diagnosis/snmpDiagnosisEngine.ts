/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * =============================================================================
 * AARS v2 — SNMP 诊断引擎（网络设备）
 *
 * 职责：
 *   1. 对无 SSH 凭证但可 SNMP 可达的网络设备执行诊断
 *   2. 通过 SNMP 探针采集接口、CPU、内存、温度等指标
 *   3. LLM 分析诊断
 *   4. 输出诊断结果（网络设备不自动执行修复，全走审核）
 * =============================================================================
 */

import { generateCompletion } from '../../../../ai/services/llm/llmService';
import { snmpInspectionRepo } from '../../../../../repositories';
import { logger } from '../../../../../utils/logger';
import { strategyRecommender } from '../adaptive/strategyRecommender';
import { probeExecutor } from './probeExecutor';
import { PROBE_INDEX } from '../probeUnit';
import type { ProbeUnit, ProbeResult, DeviceRuntimeProfile } from '../types';
import { getErrorMessage } from '../../../../../utils/errorHelpers';

export interface SnmpDiagnosisResult {
  probeResults: ProbeResult[];
  rawOutput: string;
  diagnosis: string;
  summary: string;
  rootCause: string;
  findings: string[];
  recommendations: string[];
  hasCriticalIssues: boolean;
  durationMs: number;
}

class SnmpDiagnosisEngine {
  /**
   * 执行 SNMP 诊断
   */
  async diagnose(
    device: DeviceRuntimeProfile,
    alertTitle: string,
    alertContent: string
  ): Promise<SnmpDiagnosisResult> {
    const start = Date.now();

    // Step 1: 获取全量 SNMP 探针
    const snmpProbes = this.getSnmpProbes();
    const recommended = strategyRecommender.recommend(alertTitle, alertContent, device, 5);
    const snmpRecommended = recommended.filter(p => p.oids && p.oids.length > 0);

    // 如果推荐没有 SNMP 探针，至少跑一组基础 SNMP 探针
    const probesToRun = snmpRecommended.length > 0
      ? snmpRecommended
      : snmpProbes.slice(0, 5);

    logger.info(
      `[SNMPDiagnosis] Running ${probesToRun.length} SNMP probes on ${device.hostname}`
    );

    // Step 2: 并发执行 SNMP 探针
    const probeResults = await probeExecutor.executeProbes(probesToRun, device, alertTitle);

    // Step 3: 补充 SNMP 历史数据
    const historyData = this.getSnmpHistoryData(device.deviceId);

    // Step 4: 合并输出
    const rawOutput = [
      '=== SNMP Real-time Probe Results ===',
      ...probeResults.map(r => `--- ${r.probeId} ---\n${r.rawOutput}`),
      '',
      '=== SNMP Historical Data ===',
      historyData,
    ].join('\n\n');

    // Step 5: LLM 分析
    const { diagnosis, summary, rootCause, findings, recommendations } = await this.analyzeWithLLM(
      alertTitle, alertContent, rawOutput, device
    );

    // Step 6: 判断是否有严重问题
    const hasCriticalIssues = findings.some(f =>
      f.includes('Anomaly') || f.includes('Fault') || f.includes('DOWN') ||
      f.includes('error') || f.includes('critical')
    );

    return {
      probeResults,
      rawOutput,
      diagnosis,
      summary,
      rootCause,
      findings,
      recommendations,
      hasCriticalIssues,
      durationMs: Date.now() - start,
    };
  }

  /**
   * 获取仅 SNMP 探针列表
   */
  private getSnmpProbes(): ProbeUnit[] {
    return PROBE_INDEX
      ? Array.from(PROBE_INDEX.values()).filter(p => p.oids && p.oids.length > 0)
      : [];
  }

  /**
   * 获取 SNMP 历史巡检/指标数据
   */
  private getSnmpHistoryData(deviceId: string): string {
    try {
      const parts: string[] = [];

      // 从巡检历史取
      const inspections = snmpInspectionRepo.listRecentByDeviceId(deviceId, 3);

      if (inspections.length > 0) {
        parts.push('[Recent Inspection Records]');
        for (const insp of inspections) {
          parts.push(`- ${insp.created_at}: ${insp.inspection_type} [${insp.status}] ${insp.summary || ''}`);
        }
      }

      // 从接口指标取
      const metrics = snmpInspectionRepo.listRecentInterfaceMetrics(deviceId, 10);

      if (metrics.length > 0) {
        parts.push('[Recent Interface Metrics]');
        for (const m of metrics) {
          const status = m.if_oper_status === 1 ? 'UP' : (m.if_oper_status === 2 ? 'DOWN' : 'Unknown');
          parts.push(`- ${m.interface_name}: ${status} (入错=${m.if_in_errors}, 出错=${m.if_out_errors}) @ ${m.sampled_at}`);
        }
      }

      return parts.join('\n') || '(No historical data)';
    } catch {
      return '(Failed to fetch historical data)';
    }
  }

  /**
   * LLM 分析诊断输出
   */
  private async analyzeWithLLM(
    alertTitle: string,
    alertContent: string,
    rawOutput: string,
    device: DeviceRuntimeProfile
  ): Promise<{
    diagnosis: string;
    summary: string;
    rootCause: string;
    findings: string[];
    recommendations: string[];
  }> {
    const systemPrompt = `你是一个网络运维专家，负责分析网络设备的 SNMP 诊断数据。

输出格式要求（严格JSON格式）：
\`\`\`json
{
  "summary": "One-line summary (within 50 chars)",
  "rootCause": "Root Cause Analysis",
  "diagnosis": "Detailed diagnosis description",
  "findings": ["Finding 1", "Finding 2", "Finding 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}
\`\`\`

注意事项：
- 网络设备不可自动执行修复命令
- 所有建议都应该是手动操作建议`;

    const prompt = `## 告警
**标题**: ${alertTitle}
**内容**: ${alertContent || ''}

## 设备
**设备**: ${device.hostname} (${device.ip})

## SNMP 诊断数据
${rawOutput.substring(0, 8000)}

## 要求
分析 SNMP 数据，判断设备运行状态，给出诊断结论。`;

    try {
      const text = await generateCompletion(prompt, systemPrompt, 0.3);

      let parsed: any;
      try {
        const jsonMatch = text.match(/```json\s*\n([\s\S]*?)\n?\s*```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : text.match(/\{[\s\S]*\}/)?.[0];
        if (jsonStr) parsed = JSON.parse(jsonStr);
        else throw new Error('No JSON');
      } catch {
        return {
          diagnosis: text,
          summary: 'SNMP diagnosis completed',
          rootCause: text.substring(0, 300),
          findings: ['Please check SNMP data'],
          recommendations: ['Further manual troubleshooting'],
        };
      }

      return {
        diagnosis: parsed.diagnosis || text,
        summary: parsed.summary || 'SNMP diagnosis completed',
        rootCause: parsed.rootCause || 'Unable to determine root cause',
        findings: parsed.findings || [],
        recommendations: parsed.recommendations || [],
      };
    } catch (err: unknown) {
      logger.error(`[SNMPDiagnosis] AI analysis failed: ${getErrorMessage(err)}`);
      return {
        diagnosis: `❌ AI 分析失败: ${getErrorMessage(err)}`,
        summary: 'AI analysis unavailable',
        rootCause: 'Unable to determine root cause',
        findings: ['AI analysis unavailable'],
        recommendations: ['Manually check network equipment'],
      };
    }
  }
}

export const snmpDiagnosisEngine = new SnmpDiagnosisEngine();
