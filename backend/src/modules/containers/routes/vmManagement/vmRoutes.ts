/**
 * =============================================================================
 * 虚拟机管理 - 虚拟机 CRUD 与电源操作路由
 * =============================================================================
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { logger } from '../../../../utils/logger';
import { requireRole } from '../../../../middleware/auth';
import { vmManagementService } from '../../services/vmManagement';
import type { CreateVMRequest, CloneVMRequest } from '../../../../types/vmManagement';

const router = Router();

// 获取虚拟机列表（viewer 可读）
router.get('/platforms/:platformId/vms', async (req: Request, res: Response) => {
  try {
    const vms = await vmManagementService.listVMs(req.params.platformId);
    res.json({ success: true, data: vms });
  } catch (error) {
    logger.error('❌ Failed to get virtual machine list:', error);
    res.status(500).json({ success: false, error: 'Failed to get virtual machine list' });
  }
});

// 获取单个虚拟机
router.get('/platforms/:platformId/vms/:vmId', async (req: Request, res: Response) => {
  try {
    const vm = await vmManagementService.getVM(req.params.platformId, req.params.vmId);
    if (!vm) {
      return res.status(404).json({ success: false, error: 'Virtual machine does not exist' });
    }
    res.json({ success: true, data: vm });
  } catch (error) {
    logger.error('❌ Failed to get virtual machine details:', error);
    res.status(500).json({ success: false, error: 'Failed to get virtual machine details' });
  }
});

// 创建虚拟机
router.post(
  '/platforms/:platformId/vms',
  requireRole('admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      const vm = await vmManagementService.createVM(
        req.params.platformId,
        req.body as CreateVMRequest,
      );
      res.json({ success: true, data: vm, message: 'Virtual machine created successfully' });
    } catch (error) {
      logger.error('❌ Failed to create virtual machine:', error);
      res.status(500).json({ success: false, error: 'Failed to create virtual machine' });
    }
  },
);

// 克隆虚拟机
router.post(
  '/platforms/:platformId/vms/:vmId/clone',
  requireRole('admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      const cloneRequest: CloneVMRequest = {
        ...req.body,
        vmId: req.params.vmId,
      };
      const vm = await vmManagementService.cloneVM(req.params.platformId, cloneRequest);
      res.json({ success: true, data: vm, message: 'Virtual machine cloned successfully' });
    } catch (error) {
      logger.error('❌ Failed to clone virtual machine:', error);
      res.status(500).json({ success: false, error: 'Failed to clone virtual machine' });
    }
  },
);

// 删除虚拟机
router.delete(
  '/platforms/:platformId/vms/:vmId',
  requireRole('admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      await vmManagementService.deleteVM(req.params.platformId, req.params.vmId);
      res.json({ success: true, message: 'Virtual machine deleted successfully' });
    } catch (error) {
      logger.error('❌ Failed to delete virtual machine:', error);
      res.status(500).json({ success: false, error: 'Failed to delete virtual machine' });
    }
  },
);

// 启动虚拟机
router.post(
  '/platforms/:platformId/vms/:vmId/start',
  requireRole('admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      await vmManagementService.powerOnVM(req.params.platformId, req.params.vmId);
      res.json({ success: true, message: 'Virtual machine started successfully' });
    } catch (error) {
      logger.error('❌ Failed to start virtual machine:', error);
      res.status(500).json({ success: false, error: 'Failed to start virtual machine' });
    }
  },
);

// 关闭虚拟机
router.post(
  '/platforms/:platformId/vms/:vmId/stop',
  requireRole('admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      await vmManagementService.powerOffVM(req.params.platformId, req.params.vmId);
      res.json({ success: true, message: 'Virtual machine powered off successfully' });
    } catch (error) {
      logger.error('❌ Failed to power off virtual machine:', error);
      res.status(500).json({ success: false, error: 'Failed to power off virtual machine' });
    }
  },
);

// 重启虚拟机
router.post(
  '/platforms/:platformId/vms/:vmId/restart',
  requireRole('admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      await vmManagementService.restartVM(req.params.platformId, req.params.vmId);
      res.json({ success: true, message: 'Virtual machine restarted successfully' });
    } catch (error) {
      logger.error('❌ Failed to restart virtual machine:', error);
      res.status(500).json({ success: false, error: 'Failed to restart virtual machine' });
    }
  },
);

export default router;
