/**
 * configParser 分析验证子模块（2026-07-21 拆分）
 *
 * 把原 configParser.ts L254-458 的 4 个分析方法抽出：
 * - analyze: 公开入口，按 template.parser 分发 nginx/sysctl/sshd 验证
 * - analyzeNginx: worker_processes / worker_connections / keepalive_timeout 检查
 * - analyzeSysctl: vm.swappiness / net.core.somaxconn 检查
 * - analyzeSshd: PermitRootLogin / PasswordAuthentication 检查（安全相关）
 *
 * 拆分原则遵循 architecture.md §3.3.1 + 第 3 条「向后兼容的 import 路径」
 */

import type { ConfigBlock, ConfigIssue, ConfigTemplate } from './types';
import { flattenBlocks, generateId } from './utils';

/** 分析配置问题（公开入口） */
export function analyze(template: ConfigTemplate, blocks: ConfigBlock[]): ConfigIssue[] {
  const issues: ConfigIssue[] = [];

  switch (template.parser) {
    case 'nginx':
      issues.push(...analyzeNginx(blocks));
      break;
    case 'sysctl':
      issues.push(...analyzeSysctl(blocks));
      break;
    case 'sshd':
      issues.push(...analyzeSshd(blocks));
      break;
  }

  return issues;
}

/** Nginx 配置分析（worker_processes / worker_connections / keepalive_timeout） */
export function analyzeNginx(blocks: ConfigBlock[]): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const keyValues = flattenBlocks(blocks);

  // worker_processes 检查
  const workerProcesses = keyValues.find((kv) => kv.key === 'worker_processes');
  if (workerProcesses) {
    const value = workerProcesses.value || '';
    if (value === '1' || (parseInt(value) < 2 && value !== 'auto')) {
      issues.push({
        id: generateId(),
        severity: 'medium',
        type: 'performance',
        rule: 'nginx-worker-processes',
        description: 'worker_processes setting is too low, recommended to set to auto or the number of CPU cores',
        lineNumber: workerProcesses.lineNumber,
        key: workerProcesses.key,
        currentValue: value,
        suggestedValue: 'auto',
        fixable: true,
      });
    }
  } else {
    issues.push({
      id: generateId(),
      severity: 'medium',
      type: 'bestPractice',
      rule: 'nginx-worker-processes-missing',
      description: 'Missing worker_processes configuration',
      fixable: true,
    });
  }

  // worker_connections 检查
  const workerConnections = keyValues.find((kv) => kv.key === 'worker_connections');
  if (workerConnections) {
    const value = parseInt(workerConnections.value || '0');
    if (value < 1024) {
      issues.push({
        id: generateId(),
        severity: 'medium',
        type: 'performance',
        rule: 'nginx-worker-connections',
        description: 'worker_connections setting is too low, recommended at least 1024',
        lineNumber: workerConnections.lineNumber,
        key: workerConnections.key,
        currentValue: workerConnections.value,
        suggestedValue: '2048',
        fixable: true,
      });
    }
  }

  // keepalive_timeout 检查
  const keepaliveTimeout = keyValues.find((kv) => kv.key === 'keepalive_timeout');
  if (keepaliveTimeout) {
    const value = parseInt(keepaliveTimeout.value || '0');
    if (value > 65) {
      issues.push({
        id: generateId(),
        severity: 'low',
        type: 'performance',
        rule: 'nginx-keepalive-timeout',
        description: 'keepalive_timeout setting is too long, may consume connection resources',
        lineNumber: keepaliveTimeout.lineNumber,
        key: keepaliveTimeout.key,
        currentValue: keepaliveTimeout.value,
        suggestedValue: '65',
        fixable: true,
      });
    }
  }

  return issues;
}

/** Sysctl 配置分析（vm.swappiness / net.core.somaxconn） */
export function analyzeSysctl(blocks: ConfigBlock[]): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const keyValues = flattenBlocks(blocks);

  // vm.swappiness 检查
  const swappiness = keyValues.find((kv) => kv.key === 'vm.swappiness');
  if (swappiness) {
    const value = parseInt(swappiness.value || '0');
    if (value > 60) {
      issues.push({
        id: generateId(),
        severity: 'low',
        type: 'performance',
        rule: 'sysctl-swappiness',
        description: 'vm.swappiness setting is too high, may cause frequent swapping',
        lineNumber: swappiness.lineNumber,
        key: swappiness.key,
        currentValue: swappiness.value,
        suggestedValue: '10',
        fixable: true,
      });
    }
  }

  // net.core.somaxconn 检查
  const somaxconn = keyValues.find((kv) => kv.key === 'net.core.somaxconn');
  if (somaxconn) {
    const value = parseInt(somaxconn.value || '0');
    if (value < 1024) {
      issues.push({
        id: generateId(),
        severity: 'medium',
        type: 'performance',
        rule: 'sysctl-somaxconn',
        description: 'net.core.somaxconn setting is too low, may limit connection count',
        lineNumber: somaxconn.lineNumber,
        key: somaxconn.key,
        currentValue: somaxconn.value,
        suggestedValue: '65535',
        fixable: true,
      });
    }
  }

  return issues;
}

/** SSHD 配置分析（PermitRootLogin / PasswordAuthentication 安全检查） */
export function analyzeSshd(blocks: ConfigBlock[]): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const keyValues = flattenBlocks(blocks);

  // PermitRootLogin 检查
  const permitRootLogin = keyValues.find((kv) => kv.key === 'PermitRootLogin');
  if (permitRootLogin) {
    const value = permitRootLogin.value?.toLowerCase();
    if (value === 'yes') {
      issues.push({
        id: generateId(),
        severity: 'critical',
        type: 'security',
        rule: 'sshd-permit-root-login',
        description: 'Setting PermitRootLogin to yes poses a security risk, recommended to set to no',
        lineNumber: permitRootLogin.lineNumber,
        key: permitRootLogin.key,
        currentValue: permitRootLogin.value,
        suggestedValue: 'no',
        fixable: true,
      });
    }
  } else {
    issues.push({
      id: generateId(),
      severity: 'high',
      type: 'security',
      rule: 'sshd-permit-root-login-missing',
      description: 'Missing PermitRootLogin configuration, root login may be allowed by default',
      fixable: true,
    });
  }

  // PasswordAuthentication 检查
  const passwordAuth = keyValues.find((kv) => kv.key === 'PasswordAuthentication');
  if (passwordAuth) {
    const value = passwordAuth.value?.toLowerCase();
    if (value === 'yes') {
      issues.push({
        id: generateId(),
        severity: 'medium',
        type: 'security',
        rule: 'sshd-password-auth',
        description: 'PasswordAuthentication is set to yes, using SSH keys is recommended',
        lineNumber: passwordAuth.lineNumber,
        key: passwordAuth.key,
        currentValue: passwordAuth.value,
        suggestedValue: 'no',
        fixable: true,
      });
    }
  }

  return issues;
}
