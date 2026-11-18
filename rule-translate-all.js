const fs = require('fs');
const path = require('path');

const root = '/src';

// Collect all CJK strings remaining
const items = [];
const literalRe = /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g;
const jsxRe = />([^<>{}\n]+)</g;
const commentLineRe = /^\s*(\/\/|\*|\/\*)/;

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(f)) {
      const src = fs.readFileSync(full, 'utf8');
      const lines = src.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (commentLineRe.test(line)) continue;
        for (const m of line.matchAll(literalRe)) {
          const body = m[2];
          if (/[一-鿿]/.test(body)) items.push({ file: full, text: body });
        }
        for (const m of line.matchAll(jsxRe)) {
          const body = m[1];
          if (/[一-鿿]/.test(body)) items.push({ file: full, text: body.trim() });
        }
      }
    }
  }
}
walk(root);

console.log('Found CJK items:', items.length);
const unique = [...new Set(items.map(x => x.text))];
console.log('Unique CJK items:', unique.length);

// Rule-based translator for any remaining UI strings
function ruleTranslate(s) {
  let t = s;
  t = t.replace(/确定要删除(.+?)["“](.+?)["”](.*)\?/g, 'Are you sure you want to delete $1 "$2"?');
  t = t.replace(/确定要删除(.+?)["“](.+?)["”](.*)/g, 'Are you sure you want to delete $1 "$2"?');
  t = t.replace(/确定要删除(.+?) (.+?)\?/g, 'Are you sure you want to delete $1 $2?');
  t = t.replace(/确定要删除/g, 'Are you sure you want to delete ');
  t = t.replace(/确定要/g, 'Are you sure to ');
  t = t.replace(/连接失败/g, 'Connection failed');
  t = t.replace(/加载(.*?)失败/g, 'Failed to load $1');
  t = t.replace(/保存(.*?)失败/g, 'Failed to save $1');
  t = t.replace(/创建(.*?)失败/g, 'Failed to create $1');
  t = t.replace(/删除(.*?)失败/g, 'Failed to delete $1');
  t = t.replace(/生成(.*?)失败/g, 'Failed to generate $1');
  t = t.replace(/未找到含/g, 'No items found containing');
  t = t.replace(/的(项目|镜像|策略|卷)/g, ' $1');
  t = t.replace(/暂无/g, 'No ');
  t = t.replace(/点击/g, 'Click ');
  t = t.replace(/添加/g, 'Add ');
  t = t.replace(/新建/g, 'New ');
  t = t.replace(/管理/g, ' Management');
  t = t.replace(/配置/g, ' Configuration');
  t = t.replace(/成功/g, ' Success');
  t = t.replace(/失败/g, ' Failed');
  t = t.replace(/状态/g, ' Status');
  t = t.replace(/列表/g, ' List');
  t = t.replace(/详情/g, ' Details');
  t = t.replace(/选择/g, 'Select ');
  t = t.replace(/输入/g, 'Enter ');
  t = t.replace(/请输入/g, 'Please enter ');
  t = t.replace(/请选择/g, 'Please select ');
  t = t.replace(/服务器/g, 'Server');
  t = t.replace(/网络/g, 'Network');
  t = t.replace(/设备/g, 'Device');
  t = t.replace(/容器/g, 'Container');
  t = t.replace(/镜像/g, 'Image');
  t = t.replace(/卷/g, 'Volume');
  t = t.replace(/任务/g, 'Task');
  t = t.replace(/脚本/g, 'Script');
  t = t.replace(/工作流/g, 'Workflow');
  t = t.replace(/告警/g, 'Alert');
  t = t.replace(/通知/g, 'Notification');
  t = t.replace(/用户/g, 'User');
  t = t.replace(/角色/g, 'Role');
  t = t.replace(/权限/g, 'Permission');
  t = t.replace(/策略/g, 'Policy');
  t = t.replace(/规则/g, 'Rule');
  t = t.replace(/模板/g, 'Template');
  t = t.replace(/报告/g, 'Report');
  t = t.replace(/知识/g, 'Knowledge');
  t = t.replace(/审计/g, 'Audit');
  t = t.replace(/日志/g, 'Logs');
  t = t.replace(/指标/g, 'Metrics');
  t = t.replace(/成本/g, 'Cost');
  t = t.replace(/自动/g, 'Auto');
  t = t.replace(/缩放/g, 'Scale');
  t = t.replace(/拓扑/g, 'Topology');
  t = t.replace(/根因/g, 'Root Cause');
  t = t.replace(/分析/g, 'Analysis');
  t = t.replace(/巡检/g, 'Inspection');
  t = t.replace(/检查/g, 'Check');
  t = t.replace(/执行/g, 'Execute');
  t = t.replace(/运行/g, 'Running');
  t = t.replace(/停止/g, 'Stop');
  t = t.replace(/启动/g, 'Start');
  t = t.replace(/重启/g, 'Restart');
  t = t.replace(/关闭/g, 'Close');
  t = t.replace(/打开/g, 'Open');
  t = t.replace(/查看/g, 'View');
  t = t.replace(/导出/g, 'Export');
  t = t.replace(/导入/g, 'Import');
  t = t.replace(/同步/g, 'Sync');
  t = t.replace(/备份/g, 'Backup');
  t = t.replace(/恢复/g, 'Restore');
  t = t.replace(/重试/g, 'Retry');
  t = t.replace(/重投/g, 'Retry');
  t = t.replace(/确认/g, 'Confirm');
  t = t.replace(/取消/g, 'Cancel');
  t = t.replace(/保存/g, 'Save');
  t = t.replace(/提交/g, 'Submit');
  t = t.replace(/刷新/g, 'Refresh');
  t = t.replace(/重置/g, 'Reset');
  t = t.replace(/关闭/g, 'Close');
  t = t.replace(/详情/g, 'Details');
  t = t.replace(/状态/g, 'Status');
  t = t.replace(/操作/g, 'Actions');
  t = t.replace(/吗？/g, '?');
  t = t.replace(/：/g, ': ');
  return t.trim();
}

const map = {};
for (const u of unique) {
  map[u] = ruleTranslate(u);
}

fs.writeFileSync('/out/extra-rule-translated.json', JSON.stringify(map, null, 1), 'utf8');
console.log('Generated extra rule translations for', unique.length, 'items');
