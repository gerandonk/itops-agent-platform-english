/**
 * =============================================================================
 * 虚拟机管理 - 平台管理路由
 * =============================================================================
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { logger } from '../../../../utils/logger';
import { requireRole } from '../../../../middleware/auth';
import { vmManagementService } from '../../services/vmManagement';
import type { HypervisorType, VMPlatformConfig } from '../../../../types/vmManagement';

const router = Router();

// 获取平台列表（viewer 可读）
router.get('/platforms', (req: Request, res: Response) => {
  try {
    const platforms = vmManagementService.listPlatformConfigs();
    res.json({ success: true, data: platforms });
  } catch (error) {
    logger.error('❌ Failed to get platform list:', error);
    res.status(500).json({ success: false, error: 'Failed to get platform list' });
  }
});

// 获取单个平台（viewer 可读）
router.get('/platforms/:platformId', (req: Request, res: Response) => {
  try {
    const platform = vmManagementService.getPlatformConfig(req.params.platformId);
    if (!platform) {
      return res.status(404).json({ success: false, error: 'Platform does not exist' });
    }
    res.json({ success: true, data: platform });
  } catch (error) {
    logger.error('❌ Failed to get platform details:', error);
    res.status(500).json({ success: false, error: 'Failed to get platform details' });
  }
});

// 添加平台（admin/operator）
router.post('/platforms', requireRole('admin', 'operator'), async (req: Request, res: Response) => {
  try {
    const { name, hypervisorType, host, port, username, password, config, tags } = req.body;

    if (!name || !hypervisorType || !host) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    const platformData: Omit<VMPlatformConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      name,
      hypervisorType: hypervisorType as HypervisorType,
      host,
      port: port ? parseInt(port) : undefined,
      username,
      encryptedPassword: password,
      config,
      status: 'inactive',
      tags
    };

    const platform = await vmManagementService.addPlatform(platformData);
    res.json({ success: true, data: platform, message: 'Platform added successfully' });
  } catch (error) {
    logger.error('❌ Failed to add platform:', error);
    res.status(500).json({ success: false, error: 'Failed to add platform' });
  }
});

// 更新平台（admin/operator）
router.put('/platforms/:platformId', requireRole('admin', 'operator'), async (req: Request, res: Response) => {
  try {
    const { platformId } = req.params;
    const platform = await vmManagementService.updatePlatform(platformId, req.body);
    res.json({ success: true, data: platform, message: 'Platform updated successfully' });
  } catch (error) {
    logger.error('❌ Failed to update platform:', error);
    res.status(500).json({ success: false, error: 'Failed to update platform' });
  }
});

// 删除平台（admin only — 涉及外部基础设施变更）
router.delete('/platforms/:platformId', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    await vmManagementService.deletePlatform(req.params.platformId);
    res.json({ success: true, message: 'Platform deleted successfully' });
  } catch (error) {
    logger.error('❌ Failed to delete platform:', error);
    res.status(500).json({ success: false, error: 'Failed to delete platform' });
  }
});

// 测试平台连接（admin/operator）
router.post('/platforms/:platformId/test', requireRole('admin', 'operator'), async (req: Request, res: Response) => {
  try {
    const result = await vmManagementService.testPlatformConnection(req.params.platformId);
    res.json({ success: result.success, message: result.message });
  } catch (error) {
    logger.error('❌ Failed to test platform connection:', error);
    res.status(500).json({ success: false, error: 'Failed to test platform connection' });
  }
});

export default router;