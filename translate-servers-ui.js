// Translate all remaining CJK strings in frontend/src/modules/servers
const fs = require('fs');
const path = require('path');

const manualDict = {
  "导入": "Import",
  "添加服务器": "Add Server",
  "服务器列表": "Server List",
  "分组": "Group",
  "采集所有主机信息": "Collect All Host Info",
  "采集所有性能指标": "Collect All Performance Metrics",
  "批量导入": "Batch Import",
  "新建分组": "New Group",
  "Linux Servers: 左侧黄橙渐变标识，支持 SSH 命令执行": "Linux Servers: Left yellow-orange gradient badge, supports SSH command execution",
  "Windows Servers: 左侧蓝青渐变标识，支持远程桌面": "Windows Servers: Left blue-cyan gradient badge, supports remote desktop",
  "Collect Info: 获取服务器 OS、CPU、内存、磁盘等信息": "Collect Info: Get server OS, CPU, memory, disk, etc.",
  "Run Command: 通过 SSH 远程执行命令，查看执行历史": "Run Command: Execute remote commands via SSH, view execution history"
};

const root = '/src';
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(f)) {
      let content = fs.readFileSync(full, 'utf8');
      let changed = false;
      for (const [cn, en] of Object.entries(manualDict)) {
        if (content.includes(cn)) {
          content = content.split(cn).join(en);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(full, content, 'utf8');
        console.log('Updated:', full);
      }
    }
  }
}
walk(root);
