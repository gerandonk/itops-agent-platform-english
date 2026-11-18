import type { Request, Response } from 'express';
import { Router } from 'express';
import { vmMigrationService } from '../services/vmMigrationService';
import { requireRole } from '../../../middleware/auth';
import { getErrorMessage } from '../../../utils/errorHelpers';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const vmId = req.query.vmId as string;
    const data = vmMigrationService.listMigrations(vmId);
    res.json({ success: true, data });
  } catch (err: unknown) { res.status(500).json({ success: false, message: getErrorMessage(err) }); }
});

router.get('/active', (_req: Request, res: Response) => {
  try {
    const data = vmMigrationService.getActiveMigrations();
    res.json({ success: true, data });
  } catch (err: unknown) { res.status(500).json({ success: false, message: getErrorMessage(err) }); }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const data = vmMigrationService.getMigration(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Migration task does not exist' });
    res.json({ success: true, data });
  } catch (err: unknown) { res.status(500).json({ success: false, message: getErrorMessage(err) }); }
});

router.post('/', requireRole('admin', 'operator'), async (req: Request, res: Response) => {
  try {
    const { platformId, vmId, targetHost, reason } = req.body;
    if (!platformId || !vmId || !targetHost) return res.status(400).json({ success: false, message: 'platformId, vmId, and targetHost are required' });
    const task = await vmMigrationService.startMigration(platformId, vmId, targetHost, reason);
    res.json({ success: true, data: task });
  } catch (err: unknown) { res.status(500).json({ success: false, message: getErrorMessage(err) }); }
});

router.post('/:id/cancel', requireRole('admin', 'operator'), (req: Request, res: Response) => {
  try {
    const cancelled = vmMigrationService.cancelMigration(req.params.id);
    if (!cancelled) return res.status(400).json({ success: false, message: 'Unable to cancel this migration task' });
    res.json({ success: true, message: 'Migration cancelled' });
  } catch (err: unknown) { res.status(500).json({ success: false, message: getErrorMessage(err) }); }
});

export default router;
