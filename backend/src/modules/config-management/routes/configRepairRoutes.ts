/**
 * =============================================================================
 * 配置修复 API 路由
 * =============================================================================
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { logger } from '../../../utils/logger';
import { requireRole } from '../../../middleware/auth';
import { configRepairService } from '../services/configRepairService';
import { configBackupService } from '../services/configBackupService';

const router = Router();

/**
 * 获取配置模板列表
 */
router.get('/templates', (req: Request, res: Response) => {
  try {
    const templates = configRepairService.getTemplates();
    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    logger.error('❌ Failed to get template list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template list',
    });
  }
});

/**
 * 获取单个配置模板
 */
router.get('/templates/:templateId', (req: Request, res: Response) => {
  try {
    const template = configRepairService.getTemplate(req.params.templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template does not exist',
      });
    }
    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error('❌ Failed to get template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template',
    });
  }
});

/**
 * 分析配置文件
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { deviceId, configPath, content, templateId } = req.body;

    if (!deviceId || !configPath || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
      });
    }

    // 获取设备信息（这里简化处理）
    const _deviceName = req.body.deviceName || 'Unknown';
    const _deviceIp = req.body.deviceIp || 'Unknown';

    const analysis = await configRepairService.analyzeConfig(
      deviceId,
      configPath,
      content,
      templateId,
    );

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    logger.error('❌ Failed to analyze configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze configuration',
    });
  }
});

/**
 * 生成修复方案
 */
router.post('/plan', requireRole('admin', 'operator'), async (req: Request, res: Response) => {
  try {
    const { deviceId, configPath, issues, content, _templateId } = req.body;

    if (!deviceId || !configPath || !issues || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
      });
    }

    const deviceName = req.body.deviceName || 'Unknown';
    const deviceIp = req.body.deviceIp || 'Unknown';

    const plan = await configRepairService.generateRepairPlan(
      deviceId,
      deviceName,
      deviceIp,
      configPath,
      issues,
      content,
    );

    res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    logger.error('❌ Failed to generate remediation plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate remediation plan',
    });
  }
});

/**
 * 执行修复
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { deviceId, configPath, repairPlan, templateId, content, approver } = req.body;

    if (!deviceId || !configPath || !repairPlan) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
      });
    }

    const deviceName = req.body.deviceName || 'Unknown';
    const deviceIp = req.body.deviceIp || 'Unknown';

    // 如果有内容，先备份
    if (content) {
      await configBackupService.createBackup(deviceId, deviceName, deviceIp, configPath, content);
    }

    const record = await configRepairService.executeRepair(
      deviceId,
      deviceName,
      deviceIp,
      configPath,
      repairPlan,
      templateId,
      approver,
    );

    res.json({
      success: true,
      data: {
        recordId: record.id,
        status: record.status,
      },
    });
  } catch (error) {
    logger.error('❌ Failed to execute remediation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute remediation',
    });
  }
});

/**
 * 回滚修复
 */
router.post('/rollback', async (req: Request, res: Response) => {
  try {
    const { recordId } = req.body;

    if (!recordId) {
      return res.status(400).json({
        success: false,
        error: 'Missing recordId',
      });
    }

    const success = await configRepairService.rollbackRepair(recordId);

    res.json({
      success,
      message: success ? 'Rollback successful' : 'Rollback failed',
    });
  } catch (error) {
    logger.error('❌ Failed to rollback remediation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rollback remediation',
    });
  }
});

/**
 * 获取修复记录
 */
router.get('/records/:recordId', (req: Request, res: Response) => {
  try {
    const record = configRepairService.getRepairRecord(req.params.recordId);
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Record does not exist',
      });
    }
    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    logger.error('❌ Failed to get remediation record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get remediation record',
    });
  }
});

/**
 * 获取修复记录列表
 */
router.get('/records', (req: Request, res: Response) => {
  try {
    const deviceId = req.query.deviceId as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;

    const records = configRepairService.listRepairRecords(deviceId, limit);
    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    logger.error('❌ Failed to get remediation record list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get remediation record list',
    });
  }
});

/**
 * 获取备份列表
 */
router.get('/backups', (req: Request, res: Response) => {
  try {
    const deviceId = req.query.deviceId as string;
    const configPath = req.query.configPath as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing deviceId',
      });
    }

    const backups = configBackupService.listBackups(deviceId, configPath, limit);
    res.json({
      success: true,
      data: backups,
    });
  } catch (error) {
    logger.error('❌ Failed to get backup list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get backup list',
    });
  }
});

/**
 * 获取单个备份
 */
router.get('/backups/:backupId', (req: Request, res: Response) => {
  try {
    const backup = configBackupService.getBackup(req.params.backupId);
    if (!backup) {
      return res.status(404).json({
        success: false,
        error: 'Backup does not exist',
      });
    }
    res.json({
      success: true,
      data: backup,
    });
  } catch (error) {
    logger.error('❌ Failed to get backup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get backup',
    });
  }
});

/**
 * 从备份恢复
 */
router.post(
  '/backups/:backupId/restore',
  requireRole('admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      const result = await configBackupService.restoreBackup(req.params.backupId);
      res.json({
        success: result.success,
        data: {
          message: result.message,
        },
      });
    } catch (error) {
      logger.error('❌ Failed to restore backup:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to restore backup',
      });
    }
  },
);

export default router;
