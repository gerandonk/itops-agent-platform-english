import db from '../database';
import { createHash, randomUUID } from 'crypto';
import { logger } from '../../utils/logger';

/** 为 preset workflow 生成稳定 ID（基于 name 哈希）— 避免每次启动生成新 UUID 导致重复插入 */
function presetWorkflowId(name: string): string {
  return 'preset-wf-' + createHash('sha1').update(`workflow:${name}`).digest('hex').slice(0, 32);
}

export function initializePresetWorkflows() {
  const alertAgent = db.prepare("SELECT id FROM agents WHERE name = 'Alert Handling Agent'").get() as { id: string } | undefined;
  const diagnosticAgent = db.prepare("SELECT id FROM agents WHERE name = 'Fault Diagnosis Agent'").get() as { id: string } | undefined;
  const logAgent = db.prepare("SELECT id FROM agents WHERE name = 'Log Analysis Agent'").get() as { id: string } | undefined;
  const systemCheckAgent = db.prepare("SELECT id FROM agents WHERE name = 'System Inspection Agent'").get() as { id: string } | undefined;
  const changeAgent = db.prepare("SELECT id FROM agents WHERE name = 'Change Execution Agent'").get() as { id: string } | undefined;
  const docAgent = db.prepare("SELECT id FROM agents WHERE name = 'Documentation Agent'").get() as { id: string } | undefined;
  const complianceAgent = db.prepare("SELECT id FROM agents WHERE name = 'Compliance Inspection Agent'").get() as { id: string } | undefined;
  const commandAgent = db.prepare("SELECT id FROM agents WHERE name = 'Server Command Execution Agent'").get() as { id: string } | undefined;

  const healthNode1 = randomUUID();
  const healthNode2 = randomUUID();
  const healthNode3 = randomUUID();
  
  const dailyHealthCheckNodes = JSON.stringify([
    { id: healthNode1, type: 'agent', position: { x: 100, y: 100 }, data: { label: 'System Inspection Agent', agentId: systemCheckAgent?.id || null, avatar: '🔎' } },
    { id: healthNode2, type: 'agent', position: { x: 400, y: 100 }, data: { label: 'Server Command Execution Agent', agentId: commandAgent?.id || null, avatar: '💻' } },
    { id: healthNode3, type: 'agent', position: { x: 700, y: 100 }, data: { label: 'Documentation Agent', agentId: docAgent?.id || null, avatar: '📄' } }
  ]);
  
  const dailyHealthCheckEdges = JSON.stringify([
    { id: randomUUID(), source: healthNode1, target: healthNode2 },
    { id: randomUUID(), source: healthNode2, target: healthNode3 }
  ]);

  const alertNode1 = randomUUID();
  const alertNode2 = randomUUID();
  const alertNode3 = randomUUID();
  
  const alertHandlingNodes = JSON.stringify([
    { id: alertNode1, type: 'agent', position: { x: 100, y: 100 }, data: { label: 'Alert Handling Agent', agentId: alertAgent?.id || null, avatar: '🚨' } },
    { id: alertNode2, type: 'agent', position: { x: 400, y: 100 }, data: { label: 'Log Analysis Agent', agentId: logAgent?.id || null, avatar: '📝' } },
    { id: alertNode3, type: 'agent', position: { x: 700, y: 100 }, data: { label: 'Documentation Agent', agentId: docAgent?.id || null, avatar: '📄' } }
  ]);
  
  const alertHandlingEdges = JSON.stringify([
    { id: randomUUID(), source: alertNode1, target: alertNode2 },
    { id: randomUUID(), source: alertNode2, target: alertNode3 }
  ]);

  const diagNode1 = randomUUID();
  const diagNode2 = randomUUID();
  const diagNode3 = randomUUID();
  const diagNode4 = randomUUID();
  
  const diagnosticNodes = JSON.stringify([
    { id: diagNode1, type: 'agent', position: { x: 100, y: 100 }, data: { label: 'Fault Diagnosis Agent', agentId: diagnosticAgent?.id || null, avatar: '🔍' } },
    { id: diagNode2, type: 'agent', position: { x: 400, y: 100 }, data: { label: 'Log Analysis Agent', agentId: logAgent?.id || null, avatar: '📝' } },
    { id: diagNode3, type: 'agent', position: { x: 700, y: 100 }, data: { label: 'Server Command Execution Agent', agentId: commandAgent?.id || null, avatar: '💻' } },
    { id: diagNode4, type: 'agent', position: { x: 1000, y: 100 }, data: { label: 'Documentation Agent', agentId: docAgent?.id || null, avatar: '📄' } }
  ]);
  
  const diagnosticEdges = JSON.stringify([
    { id: randomUUID(), source: diagNode1, target: diagNode2 },
    { id: randomUUID(), source: diagNode2, target: diagNode3 },
    { id: randomUUID(), source: diagNode3, target: diagNode4 }
  ]);

  const compNode1 = randomUUID();
  const compNode2 = randomUUID();
  const compNode3 = randomUUID();
  
  const complianceNodes = JSON.stringify([
    { id: compNode1, type: 'agent', position: { x: 100, y: 100 }, data: { label: 'Compliance Inspection Agent', agentId: complianceAgent?.id || null, avatar: '🛡️' } },
    { id: compNode2, type: 'agent', position: { x: 400, y: 100 }, data: { label: 'Server Command Execution Agent', agentId: commandAgent?.id || null, avatar: '💻' } },
    { id: compNode3, type: 'agent', position: { x: 700, y: 100 }, data: { label: 'Documentation Agent', agentId: docAgent?.id || null, avatar: '📄' } }
  ]);
  
  const complianceEdges = JSON.stringify([
    { id: randomUUID(), source: compNode1, target: compNode2 },
    { id: randomUUID(), source: compNode2, target: compNode3 }
  ]);

  const changeNode1 = randomUUID();
  const changeNode2 = randomUUID();
  const changeNode3 = randomUUID();
  
  const changeNodes = JSON.stringify([
    { id: changeNode1, type: 'agent', position: { x: 100, y: 100 }, data: { label: 'Change Execution Agent', agentId: changeAgent?.id || null, avatar: '⚙️' } },
    { id: changeNode2, type: 'agent', position: { x: 400, y: 100 }, data: { label: 'Server Command Execution Agent', agentId: commandAgent?.id || null, avatar: '💻' } },
    { id: changeNode3, type: 'agent', position: { x: 700, y: 100 }, data: { label: 'Documentation Agent', agentId: docAgent?.id || null, avatar: '📄' } }
  ]);
  
  const changeEdges = JSON.stringify([
    { id: randomUUID(), source: changeNode1, target: changeNode2 },
    { id: randomUUID(), source: changeNode2, target: changeNode3 }
  ]);

  const logNode1 = randomUUID();
  const logNode2 = randomUUID();
  const logNode3 = randomUUID();
  
  const logAnalysisNodes = JSON.stringify([
    { id: logNode1, type: 'agent', position: { x: 100, y: 100 }, data: { label: 'Log Analysis Agent', agentId: logAgent?.id || null, avatar: '📝' } },
    { id: logNode2, type: 'agent', position: { x: 400, y: 100 }, data: { label: 'Server Command Execution Agent', agentId: commandAgent?.id || null, avatar: '💻' } },
    { id: logNode3, type: 'agent', position: { x: 700, y: 100 }, data: { label: 'Documentation Agent', agentId: docAgent?.id || null, avatar: '📄' } }
  ]);
  
  const logAnalysisEdges = JSON.stringify([
    { id: randomUUID(), source: logNode1, target: logNode2 },
    { id: randomUUID(), source: logNode2, target: logNode3 }
  ]);
  
  const presetWorkflows = [
    {
      id: presetWorkflowId('Daily Health Check'),
      name: 'Daily Health Check',
      description: 'Perform daily health checks on servers, including system inspections, command execution, and report generation',
      nodes: dailyHealthCheckNodes,
      edges: dailyHealthCheckEdges,
      is_template: 1
    },
    {
      id: presetWorkflowId('Alert Handling'),
      name: 'Alert Handling',
      description: 'Process system alerts, analyze alert information, check logs, and generate handling reports',
      nodes: alertHandlingNodes,
      edges: alertHandlingEdges,
      is_template: 1
    },
    {
      id: presetWorkflowId('Fault Diagnosis'),
      name: 'Fault Diagnosis',
      description: 'Perform comprehensive diagnostics on system faults, analyze symptoms, check logs, execute commands, and generate diagnostic reports',
      nodes: diagnosticNodes,
      edges: diagnosticEdges,
      is_template: 1
    },
    {
      id: presetWorkflowId('Compliance Inspection'),
      name: 'Compliance Inspection',
      description: 'Verify whether server configurations comply with security baselines and compliance requirements, and generate compliance inspection reports',
      nodes: complianceNodes,
      edges: complianceEdges,
      is_template: 1
    },
    {
      id: presetWorkflowId('Change Execution'),
      name: 'Change Execution',
      description: 'Execute system change operations, verify operation results, and generate change execution reports',
      nodes: changeNodes,
      edges: changeEdges,
      is_template: 1
    },
    {
      id: presetWorkflowId('Log Analysis'),
      name: 'Log Analysis',
      description: 'Analyze system and application logs, identify error patterns and abnormal events, and generate analysis reports',
      nodes: logAnalysisNodes,
      edges: logAnalysisEdges,
      is_template: 1
    }
  ];

  const insertWorkflow = db.prepare(`
    INSERT OR IGNORE INTO workflows (id, name, description, nodes, edges, is_template)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  presetWorkflows.forEach(workflow => {
    insertWorkflow.run(workflow.id, workflow.name, workflow.description, workflow.nodes, workflow.edges, workflow.is_template);
  });

  logger.info(`✅ 成功创建 ${presetWorkflows.length} 个预设工作流`);
}
