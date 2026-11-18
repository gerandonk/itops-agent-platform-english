const fs = require('fs');
const jobs = [
  ['modules/containers/pages/containers/ContainersTab.tsx', 195, 210],
  ['modules/containers/pages/virtual-machines/VMList.tsx', 175, 190],
  ['modules/containers/pages/VmDetailPanel.tsx', 180, 230],
  ['modules/containers/pages/virtual-machines/VMPlatformSelector.tsx', 40, 55],
  ['modules/containers/pages/virtual-machines/VMStatsCards.tsx', 45, 55],
  ['modules/containers/pages/virtual-machines/DeleteVMConfirm.tsx', 14, 45],
  ['modules/containers/pages/virtual-machines/CloneVMModal.tsx', 24, 32],
  ['modules/containers/pages/containers/NetworksTab.tsx', 222, 232],
  ['modules/mcp/pages/McpOverview.tsx', 160, 310],
  ['modules/monitor/pages/big-screen/BigScreenRecentTasksList.tsx', 70, 85],
  ['modules/monitor/pages/big-screen/BigScreenRightColumn.tsx', 160, 175],
  ['modules/monitor/pages/CostAnalysis.tsx', 185, 200],
  ['modules/monitor/pages/CostAnalysis.tsx', 315, 360],
  ['modules/monitor/components/TrendCharts.tsx', 78, 130],
  ['modules/monitor/pages/big-screen/CriticalAlertBanner.tsx', 35, 55],
  ['modules/monitor/pages/big-screen/BigScreenLeftColumn.tsx', 268, 280],
  ['modules/network/pages/NetworkDiscovery.tsx', 320, 335],
  ['modules/network/pages/NetworkDiscovery.tsx', 515, 600],
  ['modules/network/pages/network-devices/BatchInspectModal.tsx', 10, 30],
  ['modules/network/pages/NetworkDevices.tsx', 80, 95],
  ['modules/network/pages/NetworkDevices.tsx', 155, 200],
  ['modules/network/pages/NetworkDevices.tsx', 280, 290],
  ['modules/monitor/pages/reports/AnalyticsTab.tsx', 80, 95],
  ['modules/monitor/pages/reports/CreateTemplateModal.tsx', 60, 85],
  ['modules/monitor/pages/Reports.tsx', 360, 375],
  ['modules/monitor/pages/prometheus/ResultsTable.tsx', 15, 60],
  ['modules/monitor/pages/ZabbixQuery.tsx', 235, 245],
  ['modules/monitor/pages/ZabbixQuery.tsx', 385, 430],
  ['modules/import-export/components/ImportExport.tsx', 115, 140],
  ['modules/dc/pages/DataCenterManage/ExportImportTab.tsx', 10, 65],
  ['modules/dc/pages/DataCenterManage/SlotsPanel.tsx', 90, 115],
  ['modules/network/pages/Topology.tsx', 195, 240],
  ['modules/network/pages/snmp/SnmpCredentialsTab.tsx', 305, 320],
  ['modules/dc/components/DataRoom3D/SlotDetailPanel.tsx', 28, 100],
  ['modules/database/pages/db-connections/DeleteDbConnectionModal.tsx', 35, 50],
  ['modules/kubernetes/pages/kubernetes/DeleteConfirmModal.tsx', 30, 40],
];
for (const [f, a, b] of jobs) {
  try {
    const L = fs.readFileSync(f, 'utf8').split('\n');
    console.log('=== ' + f + ' ' + a + '-' + b + ' ===');
    for (let i = a - 1; i < Math.min(b, L.length); i++) console.log((i + 1) + ': ' + L[i]);
  } catch (e) { console.log('MISSING ' + f); }
}
