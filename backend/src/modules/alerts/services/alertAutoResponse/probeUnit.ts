/**
 * =============================================================================
 * AARS v2 — 探针单元编目系统
 *
 * 设计思路：
 *   不是硬编码"告警类型→命令"映射表，而是声明式探针编目，
 *   每个探针携带适用范围、风险等级、信息增益权重。
 *   由 strategyRecommender 动态组合推荐。
 * =============================================================================
 */

import type { ProbeUnit } from './types';

/**
 * 全量探针编目
 * 按类别分组，每个探针有唯一 id
 */
export const PROBE_CATALOG: ProbeUnit[] = [

  // ════════════════════════ 通用探针 ════════════════════════

  {
    id: 'os_version',
    name: 'Operating system version',
    description: 'Get OS distribution and kernel version',
    applicableOS: ['linux', 'windows', 'network_os'],
    risk: 'readonly',
    commands: ['uname -a && cat /etc/os-release 2>/dev/null || cat /etc/redhat-release 2>/dev/null || hostnamectl 2>/dev/null'],
    oids: ['1.3.6.1.2.1.1.1.0'], // sysDescr
    infoGainWeight: 0.2,
    timeoutMs: 5000,
    enabled: true,
  },

  {
    id: 'uptime_load',
    name: 'Uptime and load',
    description: 'System uptime and CPU load',
    applicableOS: ['linux', 'network_os'],
    risk: 'readonly',
    commands: ['uptime && cat /proc/loadavg'],
    infoGainWeight: 0.4,
    timeoutMs: 5000,
    enabled: true,
  },

  {
    id: 'cpu_hogs',
    name: 'High CPU consumption processes',
    description: 'Top processes sorted by CPU usage',
    applicableOS: ['linux'],
    risk: 'readonly',
    commands: ['ps aux --sort=-%cpu | head -20'],
    infoGainWeight: 0.8,
    timeoutMs: 10000,
    enabled: true,
  },

  {
    id: 'mem_hogs',
    name: 'High memory consumption processes',
    description: 'Top processes sorted by memory usage',
    applicableOS: ['linux'],
    risk: 'readonly',
    commands: ['ps aux --sort=-%mem | head -20'],
    infoGainWeight: 0.8,
    timeoutMs: 10000,
    enabled: true,
  },

  {
    id: 'disk_usage',
    name: 'Disk usage',
    description: 'Disk usage of each partition',
    applicableOS: ['linux'],
    risk: 'readonly',
    commands: ['df -h | grep -v tmpfs | grep -v overlay | grep -v devtmpfs'],
    infoGainWeight: 0.7,
    timeoutMs: 5000,
    enabled: true,
  },

  {
    id: 'disk_hogs',
    name: 'Large files/directories',
    description: 'Largest disk space consumers',
    applicableOS: ['linux'],
    risk: 'readonly',
    commands: ['du -sh /* 2>/dev/null | sort -rh | head -15'],
    infoGainWeight: 0.6,
    timeoutMs: 15000,
    enabled: true,
  },

  {
    id: 'memory_detail',
    name: 'Memory details',
    description: 'Detailed memory usage (including swap/cache)',
    applicableOS: ['linux'],
    risk: 'readonly',
    commands: ['free -m && cat /proc/meminfo'],
    infoGainWeight: 0.5,
    timeoutMs: 5000,
    enabled: true,
  },

  {
    id: 'io_stats',
    name: 'Disk I/O statistics',
    description: 'Disk read/write latency and IOPS (requires sysstat)',
    applicableOS: ['linux'],
    risk: 'readonly',
    commands: ['iostat -x 1 3 2>/dev/null || echo "iostat not available"'],
    infoGainWeight: 0.5,
    timeoutMs: 8000,
    enabled: true,
  },

  {
    id: 'network_connections',
    name: 'Network connection status',
    description: 'All listening and active connections',
    applicableOS: ['linux'],
    risk: 'readonly',
    commands: ['ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null || echo "no ss/netstat"'],
    infoGainWeight: 0.6,
    timeoutMs: 5000,
    enabled: true,
  },

  {
    id: 'dmesg_errors',
    name: 'Kernel error logs',
    description: 'Recent kernel errors and alert messages',
    applicableOS: ['linux'],
    risk: 'readonly',
    commands: ['dmesg -T --level=err,warn 2>/dev/null | tail -50 || dmesg | tail -50'],
    infoGainWeight: 0.7,
    timeoutMs: 5000,
    enabled: true,
  },

  {
    id: 'journal_errors',
    name: 'System log errors',
    description: 'Recent errors in system logs',
    applicableOS: ['linux'],
    risk: 'readonly',
    commands: ['journalctl -p err -n 50 --no-pager 2>/dev/null || tail -50 /var/log/syslog 2>/dev/null || echo "no journal"'],
    infoGainWeight: 0.7,
    timeoutMs: 8000,
    enabled: true,
  },

  {
    id: 'process_tree',
    name: 'Process tree',
    description: 'Full process tree',
    applicableOS: ['linux'],
    risk: 'readonly',
    commands: ['pstree -ap 2>/dev/null | head -50 || ps -ef --forest | head -50'],
    infoGainWeight: 0.3,
    timeoutMs: 5000,
    enabled: true,
  },

  {
    id: 'failed_services',
    name: 'Failed services list',
    description: 'Services in failed state under systemd',
    applicableOS: ['linux'],
    risk: 'readonly',
    commands: ['systemctl list-units --failed --no-pager 2>/dev/null || echo "no systemctl"'],
    infoGainWeight: 0.8,
    timeoutMs: 5000,
    enabled: true,
  },

  {
    id: 'zombie_processes',
    name: 'Zombie processes',
    description: 'Check number of zombie processes',
    applicableOS: ['linux'],
    risk: 'readonly',
    commands: ['ps aux | awk \'{if ($8=="Z") print}\' | head -20'],
    infoGainWeight: 0.4,
    timeoutMs: 5000,
    enabled: true,
  },

  {
    id: 'network_bandwidth',
    name: 'Network bandwidth usage',
    description: 'Real-time network bandwidth (requires iftop/nload) or /proc/net/dev',
    applicableOS: ['linux'],
    risk: 'readonly',
    commands: ['cat /proc/net/dev | tail -n +3 | head -10'],
    infoGainWeight: 0.5,
    timeoutMs: 5000,
    enabled: true,
  },

  {
    id: 'arp_table',
    name: 'ARP table',
    description: 'Neighbor discovery table',
    applicableOS: ['linux', 'network_os'],
    risk: 'readonly',
    commands: ['ip neigh 2>/dev/null || arp -a 2>/dev/null | head -20'],
    oids: ['1.3.6.1.2.1.4.22.1.2'],
    infoGainWeight: 0.3,
    timeoutMs: 5000,
    enabled: true,
  },

  {
    id: 'listening_ports',
    name: 'Listening port security',
    description: 'All listening ports, check for redundant open ports',
    applicableOS: ['linux', 'network_os'],
    risk: 'readonly',
    commands: ['ss -tlnp 2>/dev/null | awk \'NR>1{print $4,$6}\' | head -30 || netstat -tlnp 2>/dev/null | head -30'],
    infoGainWeight: 0.4,
    timeoutMs: 5000,
    enabled: true,
  },

  // ════════════════════════ 网络设备 SNMP 探针 ════════════════════════

  {
    id: 'snmp_if_errors',
    name: 'Interface error statistics',
    description: 'In/out error and dropped packet counts for each interface',
    applicableOS: ['network_os'],
    risk: 'readonly',
    oids: [
      '1.3.6.1.2.1.2.2.1.14',  // ifInErrors
      '1.3.6.1.2.1.2.2.1.20',  // ifOutErrors
      '1.3.6.1.2.1.2.2.1.13',  // ifInDiscards
      '1.3.6.1.2.1.2.2.1.19',  // ifOutDiscards
    ],
    infoGainWeight: 0.7,
    timeoutMs: 8000,
    enabled: true,
  },

  {
    id: 'snmp_cpu_usage',
    name: 'CPU usage (SNMP)',
    description: 'Network device CPU utilization',
    applicableOS: ['network_os'],
    risk: 'readonly',
    oids: ['1.3.6.1.4.1.9.9.109.1.1.1.1.7'],  // CISCO-CPU
    infoGainWeight: 0.8,
    timeoutMs: 5000,
    enabled: true,
  },

  {
    id: 'snmp_mem_usage',
    name: 'Memory usage (SNMP)',
    description: 'Network device memory utilization',
    applicableOS: ['network_os'],
    risk: 'readonly',
    oids: ['1.3.6.1.4.1.9.9.48.1.1.1.5'],  // CISCO-MEMORY
    infoGainWeight: 0.7,
    timeoutMs: 5000,
    enabled: true,
  },

  {
    id: 'snmp_temperature',
    name: 'Device temperature (SNMP)',
    description: 'Device temperature and fan status',
    applicableOS: ['network_os'],
    risk: 'readonly',
    oids: ['1.3.6.1.4.1.9.9.13.1.3.1.3'],  // CISCO-ENVMON
    infoGainWeight: 0.6,
    timeoutMs: 5000,
    enabled: true,
  },

  {
    id: 'snmp_interface_status',
    name: 'Interface status',
    description: 'Administrative and operational status of each interface',
    applicableOS: ['network_os'],
    risk: 'readonly',
    oids: [
      '1.3.6.1.2.1.2.2.1.7',  // ifAdminStatus
      '1.3.6.1.2.1.2.2.1.8',  // ifOperStatus
    ],
    infoGainWeight: 0.9,
    timeoutMs: 8000,
    enabled: true,
  },

  {
    id: 'snmp_interface_traffic',
    name: 'Interface traffic',
    description: 'In/out traffic rate for each interface',
    applicableOS: ['network_os'],
    risk: 'readonly',
    oids: [
      '1.3.6.1.2.1.2.2.1.10',  // ifInOctets
      '1.3.6.1.2.1.2.2.1.16',  // ifOutOctets
    ],
    infoGainWeight: 0.6,
    timeoutMs: 8000,
    enabled: true,
  },

  {
    id: 'snmp_system_uptime',
    name: 'Device uptime (SNMP)',
    description: 'Network device startup duration',
    applicableOS: ['network_os'],
    risk: 'readonly',
    oids: ['1.3.6.1.2.1.1.3.0'],  // sysUpTime
    infoGainWeight: 0.2,
    timeoutMs: 5000,
    enabled: true,
  },

  // ════════════════════════ 专项诊断探针 ════════════════════════

  {
    id: 'app_log_tail',
    name: 'Application log tail',
    description: 'Last 50 lines of specific application logs (requires parameters)',
    applicableOS: ['linux'],
    risk: 'readonly',
    commands: ['tail -50 {{log_path}} 2>/dev/null || echo "log not found"'],
    infoGainWeight: 0.5,
    timeoutMs: 5000,
    enabled: true,
  },

  {
    id: 'process_detail',
    name: 'Process details',
    description: 'Detailed info of specified process (fd/open files)',
    applicableOS: ['linux'],
    risk: 'readonly',
    commands: ['ls -la /proc/{{pid}}/fd 2>/dev/null | head -30 && cat /proc/{{pid}}/status 2>/dev/null'],
    infoGainWeight: 0.6,
    timeoutMs: 5000,
    enabled: true,
  },

  {
    id: 'docker_ps',
    name: 'Container list',
    description: 'Docker container running status',
    applicableOS: ['linux'],
    risk: 'readonly',
    commands: ['docker ps -a 2>/dev/null | head -30 || echo "docker not available"'],
    infoGainWeight: 0.4,
    timeoutMs: 8000,
    enabled: true,
  },

  {
    id: 'selinux_apparmor',
    name: 'SELinux/AppArmor status',
    description: 'Mandatory access control status',
    applicableOS: ['linux'],
    risk: 'readonly',
    commands: ['getenforce 2>/dev/null; sestatus 2>/dev/null | head -5; aa-status 2>/dev/null | head -10; echo "---"'],
    infoGainWeight: 0.3,
    timeoutMs: 5000,
    enabled: true,
  },
];

// ── 探针索引 ──

export const PROBE_INDEX = new Map<string, ProbeUnit>();
for (const probe of PROBE_CATALOG) {
  PROBE_INDEX.set(probe.id, probe);
}

// ── 按类别分组 ──

export interface ProbeGroup {
  id: string;
  name: string;
  probes: ProbeUnit[];
}

export const PROBE_GROUPS: ProbeGroup[] = [
  {
    id: 'general',
    name: 'General basic probe',
    probes: PROBE_CATALOG.filter(p => p.applicableOS.includes('linux') && p.risk === 'readonly'),
  },
  {
    id: 'snmp_network',
    name: 'SNMP network device probe',
    probes: PROBE_CATALOG.filter(p => p.applicableOS.includes('network_os')),
  },
  {
    id: 'specialized',
    name: 'Specialized diagnostic probe',
    probes: PROBE_CATALOG.filter(p => p.applicableOS.includes('linux') && (p.id.startsWith('app_') || p.id.startsWith('process_') || p.id.startsWith('docker_') || p.id.startsWith('selinux_'))),
  },
];

/**
 * 根据告警内容关键词匹配最相关探针
 * 基于 TF-IDF 风格的简单关键词匹配
 */
export function findProbesByAlertText(alertTitle: string, alertContent: string): ProbeUnit[] {
  const text = `${alertTitle} ${alertContent}`.toLowerCase();
  const keywords = text.split(/[\s\-_,.:/]+/).filter(k => k.length > 2);
  const scored = PROBE_CATALOG.filter(p => p.enabled).map(probe => {
    let score = 0;
    const desc = probe.description.toLowerCase();
    const name = probe.name.toLowerCase();
    for (const kw of keywords) {
      if (desc.includes(kw) || name.includes(kw)) score += 1;
    }
    // 探针自身上下文中的关键词
    for (const cmd of probe.commands || []) {
      if (cmd.toLowerCase().includes('cpu') && text.includes('cpu')) score += 2;
      if (cmd.toLowerCase().includes('mem') && (text.includes('memory') || text.includes('mem'))) score += 2;
      if (cmd.toLowerCase().includes('disk') && (text.includes('disk') || text.includes('storage'))) score += 2;
      if (cmd.toLowerCase().includes('network') && text.includes('network')) score += 2;
      if (cmd.toLowerCase().includes('service') && (text.includes('service') || text.includes('process'))) score += 2;
      if (cmd.toLowerCase().includes('docker') && text.includes('docker')) score += 2;
    }
    return { probe, score: score + probe.infoGainWeight * 5 };
  });

  return scored
    .filter(s => s.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(s => s.probe);
}

export function getProbeById(id: string): ProbeUnit | undefined {
  return PROBE_INDEX.get(id);
}
