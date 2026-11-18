/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from 'express';
import { Router } from 'express';
import { requireRole } from '../../../middleware/auth';
import { getErrorMessage } from '../../../utils/errorHelpers';
import { logger } from '../../../utils/logger';
import { networkSubnetCrudService } from '../services/networkSubnetCrudService';

const router = Router();

// ==================== 子网 CRUD ====================

router.get('/', (_req: Request, res: Response) => {
  try {
    const subnets = networkSubnetCrudService.listSubnets();
    res.json({ success: true, data: subnets });
  } catch (error) {
    logger.error('Failed to list subnets:', error);
    res.status(500).json({ success: false, error: 'Failed to get subnet list' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const subnet = networkSubnetCrudService.getSubnetById(req.params.id);
    if (!subnet) return res.status(404).json({ success: false, error: 'Subnet does not exist' });
    res.json({ success: true, data: subnet });
  } catch (error) {
    logger.error('Failed to get subnet:', error);
    res.status(500).json({ success: false, error: 'Failed to get subnet' });
  }
});

router.post('/', requireRole('admin', 'operator'), (req: Request, res: Response) => {
  try {
    const result = networkSubnetCrudService.createSubnet(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    res.json({ success: true, data: result.data });
  } catch (e: unknown) {
    logger.error('Failed to create subnet:', e);
    res.status(500).json({ success: false, error: getErrorMessage(e) || 'Failed to create subnet' });
  }
});

router.put('/:id', requireRole('admin', 'operator'), (req: Request, res: Response) => {
  try {
    networkSubnetCrudService.updateSubnet(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to update subnet:', error);
    res.status(500).json({ success: false, error: 'Failed to update subnet' });
  }
});

router.delete('/:id', requireRole('admin', 'operator'), (req: Request, res: Response) => {
  try {
    networkSubnetCrudService.deleteSubnet(req.params.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete subnet:', error);
    res.status(500).json({ success: false, error: 'Failed to delete subnet' });
  }
});

// ==================== IP 地址管理 ====================

router.get('/:id/ips', (req: Request, res: Response) => {
  try {
    const data = networkSubnetCrudService.listSubnetIps(req.params.id, req.query as Record<string, string>);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Failed to list subnet IPs:', error);
    res.status(500).json({ success: false, error: 'Failed to get IP list' });
  }
});

router.put('/:id/ips/:ipId', requireRole('admin', 'operator'), (req: Request, res: Response) => {
  try {
    networkSubnetCrudService.updateIp(req.params.ipId, req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to update subnet IP:', error);
    res.status(500).json({ success: false, error: 'Failed to update IP' });
  }
});

router.post('/:id/ips/batch', requireRole('admin', 'operator'), (req: Request, res: Response) => {
  try {
    const { ip_ids, ...rest } = req.body as { ip_ids: string[]; status?: string; device_name?: string; description?: string };
    const result = networkSubnetCrudService.batchUpdateIps(ip_ids, req.params.id, rest);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    res.json({ success: true, data: { count: result.count } });
  } catch (error) {
    logger.error('Failed to batch update subnet IPs:', error);
    res.status(500).json({ success: false, error: 'Batch operation failed' });
  }
});

export default router;
