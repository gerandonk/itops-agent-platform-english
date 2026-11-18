/**
 * =============================================================================
 * 虚拟机管理 - 审计日志路由
 * =============================================================================
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { logger } from '../../../../utils/logger';
import { vmManagementService } from '../../services/vmManagement';

const router = Router();

// 获取审计日志
router.get('/audit', (req: Request, res: Response) => {
  try {
    const { platformId, vmId, limit } = req.query;
    const logs = vmManagementService.getAuditLogs(
      platformId as string | undefined,
      vmId as string | undefined,
      limit ? parseInt(limit as string) : 100
    );
    res.json({ success: true, data: logs });
  } catch (error) {
    logger.error('❌ Failed to get audit logs:', error);
    res.status(500).json({ success: false, error: 'Failed to get audit logs' });
  }
});

export default router;