/**
 * =============================================================================
 * 虚拟机管理 - 快照管理路由
 * =============================================================================
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { logger } from '../../../../utils/logger';
import { requireRole } from '../../../../middleware/auth';
import { vmManagementService } from '../../services/vmManagement';
import type { CreateSnapshotRequest, RestoreSnapshotRequest } from '../../../../types/vmManagement';

const router = Router();

// 获取快照列表（viewer 可读）
router.get('/platforms/:platformId/vms/:vmId/snapshots', async (req: Request, res: Response) => {
  try {
    const snapshots = await vmManagementService.listSnapshots(
      req.params.platformId,
      req.params.vmId,
    );
    res.json({ success: true, data: snapshots });
  } catch (error) {
    logger.error('❌ Failed to get snapshot list:', error);
    res.status(500).json({ success: false, error: 'Failed to get snapshot list' });
  }
});

// 创建快照
router.post(
  '/platforms/:platformId/vms/:vmId/snapshots',
  requireRole('admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      const snapshotRequest: CreateSnapshotRequest = {
        ...req.body,
        vmId: req.params.vmId,
      };
      const snapshot = await vmManagementService.createSnapshot(
        req.params.platformId,
        snapshotRequest,
      );
      res.json({ success: true, data: snapshot, message: 'Snapshot created successfully' });
    } catch (error) {
      logger.error('❌ Failed to create snapshot:', error);
      res.status(500).json({ success: false, error: 'Failed to create snapshot' });
    }
  },
);

// 恢复快照
router.post('/platforms/:platformId/vms/:vmId/snapshots/:snapshotId/restore', requireRole('admin', 'operator'), async (req: Request, res: Response) => {
    try {
      const restoreRequest: RestoreSnapshotRequest = {
        ...req.body,
        vmId: req.params.vmId,
        snapshotId: req.params.snapshotId,
      };
      await vmManagementService.restoreSnapshot(req.params.platformId, restoreRequest);
      res.json({ success: true, message: 'Snapshot restored successfully' });
    } catch (error) {
      logger.error('❌ Failed to restore snapshot:', error);
      res.status(500).json({ success: false, error: 'Failed to restore snapshot' });
    }
  },
);

// 删除快照
router.delete(
  '/platforms/:platformId/vms/:vmId/snapshots/:snapshotId',
  async (req: Request, res: Response) => {
    try {
      await vmManagementService.deleteSnapshot(
        req.params.platformId,
        req.params.snapshotId,
        req.params.vmId,
      );
      res.json({ success: true, message: 'Snapshot deleted successfully' });
    } catch (error) {
      logger.error('❌ Failed to delete snapshot:', error);
      res.status(500).json({ success: false, error: 'Failed to delete snapshot' });
    }
  },
);

export default router;
