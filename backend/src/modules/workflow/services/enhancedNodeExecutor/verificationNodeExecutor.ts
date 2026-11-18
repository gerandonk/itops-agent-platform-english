/**
 * Verification 节点执行器：5级验证门禁链
 *
 * 从原 enhancedNodeExecutor.ts 拆分（2026-07-08 P1-7 拆分）。
 * 包含：
 *   - executeVerificationNode：主入口，按门禁顺序依次检查
 *   - 5 个检查器：service_health / metric_recovery / baseline_comparison / impact_assessment
 *   - formatVerificationOutput：markdown 输出格式化
 */
import { serversRepo, settingsRepository } from '../../../../repositories';
import { logger } from '../../../../utils/logger';
import { executeCommand } from '../../../servers/services/sshService/index';
import type { NodeResult } from '../../../../types';
import type { VerificationNodeConfig, VerificationStage } from '../enhancedNodeTypes';
import { getErrorMessage } from '../../../../utils/errorHelpers';
import { delay } from './delay';

interface GateStage {
  stage: VerificationStage;
  required: boolean;
  maxRetries: number;
  retryIntervalSec: number;
  timeoutSec: number;
}

const DEFAULT_GATES: GateStage[] = [
  { stage: 'command_success', required: true, maxRetries: 0, retryIntervalSec: 0, timeoutSec: 30 },
  { stage: 'service_health', required: true, maxRetries: 3, retryIntervalSec: 10, timeoutSec: 60 },
  { stage: 'metric_recovery', required: true, maxRetries: 2, retryIntervalSec: 30, timeoutSec: 120 },
  { stage: 'baseline_comparison', required: false, maxRetries: 0, retryIntervalSec: 0, timeoutSec: 30 },
  { stage: 'impact_assessment', required: true, maxRetries: 0, retryIntervalSec: 0, timeoutSec: 30 },
];

export async function executeVerificationNode(
  config: VerificationNodeConfig,
  serverId?: string,
): Promise<NodeResult> {
  const stages = buildGateStages(config);
  const stageResults: Array<{ stage: VerificationStage; passed: boolean; skipped: boolean; detail: string }> = [];
  let failedStage: VerificationStage | null = null;

  for (const gate of stages) {
    let passed = false;
    let detail = '';

    for (let attempt = 0; attempt <= gate.maxRetries; attempt++) {
      if (attempt > 0) {
        await delay(gate.retryIntervalSec * 1000);
      }

      try {
        const result = await runGateCheck(gate.stage, serverId);
        passed = result.passed;
        detail = result.detail;
        if (passed) break;
      } catch (err: unknown) {
        detail = `Check Exception: ${getErrorMessage(err) || String(err)}`;
        logger.warn(`verification gate ${gate.stage} attempt ${attempt + 1}/${gate.maxRetries + 1}: ${detail}`);
      }
    }

    if (!passed && gate.required) {
      stageResults.push({ stage: gate.stage, passed: false, skipped: false, detail });
      failedStage = gate.stage;
      break; // 必须门禁失败，终止后续检查
    }

    stageResults.push({ stage: gate.stage, passed, skipped: !gate.required && !passed, detail });
    if (!passed) continue;
  }

  const overallResult = failedStage ? 'failed'
    : stageResults.some(s => !s.passed && !s.skipped) ? 'partially_passed_with_warning'
    : 'passed';

  const output = formatVerificationOutput(overallResult, stageResults, failedStage);

  return {
    status: overallResult === 'failed' ? 'failed' : 'success',
    output,
    metadata: {
      overallResult,
      stages: stageResults,
      failedStage,
    },
  };
}

function buildGateStages(config: VerificationNodeConfig): GateStage[] {
  if (!config.gates || config.gates.length === 0) return [...DEFAULT_GATES];
  return config.gates.map((stage: string) => {
    const base = DEFAULT_GATES.find((g: GateStage) => g.stage === stage) || { stage: stage as VerificationStage, required: true, maxRetries: 0, retryIntervalSec: 0, timeoutSec: 30 };
    const overrides = config.stageOverrides?.[stage as VerificationStage] || {};
    return { ...base, ...overrides };
  });
}

async function runGateCheck(stage: VerificationStage, serverId?: string): Promise<{ passed: boolean; detail: string }> {
  if (!serverId) {
    return { passed: false, detail: 'Server not specified, cannot execute verification' };
  }

  const server = serversRepo.getById(serverId) as { id: string; hostname: string; port: number; username: string; use_ssh_key: number; private_key?: string; password?: string } | undefined;
  if (!server) {
    return { passed: false, detail: `Server ${serverId} does not exist` };
  }

  try {
    switch (stage) {
      case 'command_success':
        return { passed: true, detail: 'Command already executed (guaranteed by preceding node)' };

      case 'service_health':
        return await checkServiceHealth(server);
      case 'metric_recovery':
        return await checkMetricRecovery(server);
      case 'baseline_comparison':
        return await checkBaselineComparison(server);
      case 'impact_assessment':
        return await checkImpactAssessment(server);
      default:
        return { passed: true, detail: 'Unknown verification stage, passed by default' };
    }
  } catch (err: unknown) {
    return { passed: false, detail: `SSH execution failed: ${getErrorMessage(err) || String(err)}` };
  }
}

async function checkServiceHealth(server: { id: string; hostname: string; port: number; username: string; use_ssh_key: number; private_key?: string; password?: string }): Promise<{ passed: boolean; detail: string }> {
  try {
    // 检查系统关键服务：sshd, cron, rsyslog/systemd-journald
    const result = await executeCommand(
      server.id as string,
      'systemctl is-active sshd 2>/dev/null; systemctl is-active cron 2>/dev/null || systemctl is-active crond 2>/dev/null; echo "---UP---"',
      { timeout: 15000 }
    );
    const output = result.stdout || '';
    const failedServices = output.split('\n')
      .filter((line: string) => line && line !== '---UP---' && line.trim() !== 'active' && line.trim() !== 'inactive')
      .filter(Boolean);

    if (failedServices.length === 0) {
      return { passed: true, detail: 'Critical services running normally' };
    }
    return { passed: false, detail: `Abnormal services: ${failedServices.join(', ')}` };
  } catch {
    return { passed: false, detail: 'Failed to check service status' };
  }
}

async function checkMetricRecovery(server: { id: string; hostname: string; port: number; username: string; use_ssh_key: number; private_key?: string; password?: string }): Promise<{ passed: boolean; detail: string }> {
  try {
    const result = await executeCommand(
      server.id as string,
      'echo "LOAD:$(cat /proc/loadavg | awk \'{print $1}\')" && echo "MEM:$(free -m | awk \'/^Mem:/{printf "%.0f", $3/$2*100}\')" && echo "DISK:$(df -h / | awk \'NR==2{print $5}\' | tr -d \'%\')"',
      { timeout: 10000 }
    );
    const output = result.stdout || '';

    const loadMatch = output.match(/LOAD:([\d.]+)/);
    const memMatch = output.match(/MEM:(\d+)/);
    const diskMatch = output.match(/DISK:(\d+)/);

    const load = loadMatch ? parseFloat(loadMatch[1]) : 0;
    const mem = memMatch ? parseInt(memMatch[1]) : 0;
    const disk = diskMatch ? parseInt(diskMatch[1]) : 0;

    const issues: string[] = [];
    if (load > 5) issues.push(`CPU load high: ${load}`);
    if (mem > 90) issues.push(`Memory usage high: ${mem}%`);
    if (disk > 90) issues.push(`Disk usage high: ${disk}%`);

    if (issues.length === 0) {
      return { passed: true, detail: `Metrics normal (Load:${load}, Memory:${mem}%, Disk:${disk}%)` };
    }
    return { passed: false, detail: issues.join('; ') };
  } catch {
    return { passed: false, detail: 'Failed to check system metrics' };
  }
}

async function checkBaselineComparison(server: { id: string; hostname: string; port: number; username: string; use_ssh_key: number; private_key?: string; password?: string }): Promise<{ passed: boolean; detail: string }> {
  try {
    // 简单基线对比：获取当前负载和最近一次记录的负载
    const result = await executeCommand(
      server.id as string,
      'cat /proc/loadavg 2>/dev/null',
      { timeout: 5000 }
    );
    const output = (result.stdout || '').trim();
    const currentLoad = output ? parseFloat(output.split(/\s+/)[0]) : 0;

    // 从数据库获取上次基线
    const lastBaselineValue = settingsRepository.getValue(`aars_baseline:${server.id}:last_loadavg`);

    const baselineValue = lastBaselineValue ? parseFloat(lastBaselineValue) : currentLoad;
    const threshold = baselineValue * 1.5; // 基线 +50%

    if (currentLoad <= threshold) {
      return { passed: true, detail: `Current load ${currentLoad} within baseline range (Baseline: ${baselineValue}, Threshold: ${threshold.toFixed(1)})` };
    }
    return { passed: false, detail: `Current load ${currentLoad} exceeds baseline ${threshold.toFixed(1)}` };
  } catch {
    return { passed: false, detail: 'Baseline comparison failed' };
  }
}

async function checkImpactAssessment(server: { id: string; hostname: string; port: number; username: string; use_ssh_key: number; private_key?: string; password?: string }): Promise<{ passed: boolean; detail: string }> {
  try {
    // 检查关键进程和端口是否正常
    const result = await executeCommand(
      server.id as string,
      'ps aux --no-headers | wc -l && echo "---" && ss -tlnp 2>/dev/null | wc -l',
      { timeout: 10000 }
    );
    const output = result.stdout || '';
    const parts = output.split('---');

    const processCount = parseInt(parts[0]?.trim() || '0');
    const portCount = parseInt(parts[1]?.trim() || '0');

    if (processCount > 10 && portCount > 0) {
      return { passed: true, detail: `System running normally (Process count:${processCount}, Listening ports:${portCount})` };
    }
    return { passed: false, detail: `System may be abnormal (Process count:${processCount}, Listening ports:${portCount})` };
  } catch {
    return { passed: false, detail: 'Impact assessment check failed' };
  }
}

function formatVerificationOutput(
  overall: string,
  stages: Array<{ stage: VerificationStage; passed: boolean; skipped: boolean; detail: string }>,
  failedStage: VerificationStage | null
): string {
  const statusIcons: Record<string, string> = { 'passed': '✅', 'failed': '❌', 'partially_passed_with_warning': '⚠️' };
  const icon = statusIcons[overall] || '❓';

  let output = `## ${icon} Verification Result: ${overall === 'passed' ? 'All Passed' : overall === 'failed' ? 'Verification Failed' : 'Partially Passed (With Warnings)'}\\n\\n`;
  output += '| Stage | Result | Details |\\n|-------|--------|---------|\\n';

  for (const s of stages) {
    const resultIcon = s.passed ? '✅' : s.skipped ? '⏭️' : '❌';
    const stageNames: Record<string, string> = {
      command_success: 'Command Execution', service_health: 'Service Health',
      metric_recovery: 'Metric Recovery', baseline_comparison: 'Baseline Comparison', impact_assessment: 'Impact Assessment',
    };
    output += `| ${stageNames[s.stage] || s.stage} | ${resultIcon} | ${s.detail} |\n`;
  }

  if (failedStage) {
    output += `\\n> ❌ Gate **${failedStage}** failed, verification aborted`;
  }

  return output;
}
