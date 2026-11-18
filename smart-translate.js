// Smart rule-based translator for remaining IT/Ops terms
const fs = require('fs');

const pending = JSON.parse(fs.readFileSync('/out/pending.json', 'utf8'));
const dict = JSON.parse(fs.readFileSync('/dict.json', 'utf8'));

function smartTranslate(s) {
  if (dict[s]) return dict[s];
  
  // Rule-based substitution
  let t = s;
  t = t.replace(/新建/g, 'New ');
  t = t.replace(/编辑/g, 'Edit ');
  t = t.replace(/添加/g, 'Add ');
  t = t.replace(/删除/g, 'Delete ');
  t = t.replace(/确定/g, 'Confirm ');
  t = t.replace(/查看/g, 'View ');
  t = t.replace(/管理/g, ' Management');
  t = t.replace(/列表/g, ' List');
  t = t.replace(/详情/g, ' Details');
  t = t.replace(/状态/g, ' Status');
  t = t.replace(/配置/g, ' Configuration');
  t = t.replace(/设置/g, ' Settings');
  t = t.replace(/成功/g, ' Success');
  t = t.replace(/失败/g, ' Failed');
  t = t.replace(/中\.\.\./g, '...ing');
  t = t.replace(/中/g, ' in progress');
  t = t.replace(/请输入/g, 'Please enter ');
  t = t.replace(/请选择/g, 'Please select ');
  t = t.replace(/全部/g, 'All ');
  t = t.replace(/搜索/g, 'Search ');
  
  return t.trim();
}

const newDict = {};
for (const item of pending) {
  const text = item.text;
  if (!dict[text]) {
    const translated = smartTranslate(text);
    if (translated !== text) {
      newDict[text] = translated;
    }
  }
}

console.log('Generated rule-based translations:', Object.keys(newDict).length);
fs.writeFileSync('/out/dict-rules.json', JSON.stringify(newDict, null, 1));
