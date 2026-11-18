export const RCA_PROMPT = `你是一个IT运维根因分析专家。请根据以下信息分析故障根因，并以JSON格式输出分析结果。

## 告警信息
- 告警ID: {alert_id}
- 告警标题: {alert_title}
- 告警级别: {severity}
- 告警内容: {alert_message}
- 触发时间: {triggered_at}

## 服务器信息
- 服务器名称: {server_name}
- 服务器IP: {server_ip}
- 服务器状态: {server_status}

## 拓扑信息
{topology_info}

## 变更记录
{change_records}

## 关联告警
{related_alerts}

## 知识库匹配
{knowledge_matches}

请分析上述信息，找出故障的根本原因。输出必须是有效的JSON格式，结构如下：

\`\`\`json
{
  "root_cause": "Root cause description, detailing the fundamental cause of the fault",
  "root_cause_type": "Root cause type, e.g. configuration|deployment|hardware|network|application|external|unknown",
  "confidence": 0.0-1.0之间的置信度数值,
  "affected_chain": ["List of affected server or service IDs, ordered by impact propagation"],
  "timeline": [
    {
      "time": "Event occurrence time",
      "event": "Event description"
    }
  ],
  "evidence": ["List of evidence supporting root cause determination"],
  "recommendations": ["List of remediation suggestions and preventive measures"]
}
\`\`\``;
