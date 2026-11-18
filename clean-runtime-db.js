const Database = require('better-sqlite3');
const db = new Database('/app/data/app.db');

db.prepare(`UPDATE alerts SET title = 'Self-Monitor: ' || REPLACE(SUBSTR(title, 11), '异常', 'Anomaly') WHERE title LIKE '自监控:%'`).run();

const errAlerts = db.prepare("SELECT id, content FROM alerts WHERE content LIKE '%错误率过高%'").all();
for (const a of errAlerts) {
  let newContent = a.content
    .replace('错误率过高:', 'High Error Rate:')
    .replace('最近', 'Last')
    .replace('分钟', 'mins')
    .replace('个错误', 'errors')
    .replace('阈值:', 'threshold:');
  db.prepare('UPDATE alerts SET content = ? WHERE id = ?').run(newContent, a.id);
}

try {
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
} catch (e) {
  console.log('alert_workflow_mappings skip:', e.message);
}

console.log('Runtime DB cleanup done.');
