const Database = require('better-sqlite3');
const db = new Database('/app/data/app.db');

// 1. Fix any remaining 异常 in alerts
db.prepare(`UPDATE alerts SET title = REPLACE(title, '异常', 'Anomaly'), content = REPLACE(content, '异常', 'Anomaly')`).run();

// 2. Fix alert_workflow_mappings alert_title_pattern
const mapUpdates = [
  ['宕机', 'Server Down'],
  ['磁盘', 'Disk Space'],
  ['内存', 'Memory Usage'],
  ['日志', 'Log Error'],
  ['网络', 'Network Issue'],
  ['合规', 'Compliance']
];
for (const [cn, en] of mapUpdates) {
  db.prepare('UPDATE alert_workflow_mappings SET alert_title_pattern = REPLACE(alert_title_pattern, ?, ?)').run(cn, en);
}

console.log('Remaining CJK in alerts:', db.prepare("SELECT COUNT(*) c FROM alerts WHERE title LIKE '%异常%' OR content LIKE '%异常%'").get().c);
console.log('Remaining CJK in mappings:', db.prepare("SELECT COUNT(*) c FROM alert_workflow_mappings WHERE alert_title_pattern LIKE '%宕机%' OR alert_title_pattern LIKE '%磁盘%' OR alert_title_pattern LIKE '%内存%' OR alert_title_pattern LIKE '%日志%' OR alert_title_pattern LIKE '%网络%' OR alert_title_pattern LIKE '%合规%'").get().c);
