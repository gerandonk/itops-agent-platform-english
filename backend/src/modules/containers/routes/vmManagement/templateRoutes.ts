/**
 * =============================================================================
 * 虚拟机管理 - 模板管理路由
 * =============================================================================
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { logger } from '../../../../utils/logger';
import { requireRole } from '../../../../middleware/auth';
import { vmManagementService } from '../../services/vmManagement';

const router = Router();

// 获取模板列表（viewer 可读）
router.get('/platforms/:platformId/templates', async (req: Request, res: Response) => {
  try {
    const templates = await vmManagementService.listTemplates(req.params.platformId);
    res.json({ success: true, data: templates });
  } catch (error) {
    logger.error('❌ Failed to get template list:', error);
    res.status(500).json({ success: false, error: 'Failed to get template list' });
  }
});

// 创建模板
router.post('/platforms/:platformId/vms/:vmId/template', async (req: Request, res: Response) => {
  try {
    const template = await vmManagementService.createTemplate(
      req.params.platformId,
      req.params.vmId,
      req.body.name,
      req.body.description,
    );
    res.json({ success: true, data: template, message: 'Template created successfully' });
  } catch (error) {
    logger.error('❌ Failed to create template:', error);
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

// 删除模板
router.delete(
  '/platforms/:platformId/templates/:templateId',
  requireRole('admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      await vmManagementService.deleteTemplate(req.params.platformId, req.params.templateId);
      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
      logger.error('❌ Failed to delete template:', error);
      res.status(500).json({ success: false, error: 'Failed to delete template' });
    }
  },
);

export default router;
