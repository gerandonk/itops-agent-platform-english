import type { Request, Response } from 'express';
import { Router } from 'express';
import { alertNoiseReductionService } from '../services/alertNoiseReductionService';

const router = Router();

router.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = alertNoiseReductionService.getNoiseReductionStats();
    res.json({ success: true, data: stats });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get noise reduction stats' });
  }
});

router.get('/suppressed', (_req: Request, res: Response) => {
  try {
    const alerts = alertNoiseReductionService.getSuppressedAlerts();
    res.json({ success: true, data: alerts });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get suppressed alerts' });
  }
});

router.post('/unsuppress', (req: Request, res: Response) => {
  try {
    const { fingerprint } = req.body;
    if (!fingerprint) {
      return res.status(400).json({ success: false, error: 'Fingerprint cannot be empty' });
    }

    const result = alertNoiseReductionService.unsuppressAlert(fingerprint);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Corresponding alert not found' });
    }

    res.json({ success: true, message: 'Alert recovered' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to unsuppress alert' });
  }
});

router.post('/suppress', (req: Request, res: Response) => {
  try {
    const { fingerprint, reason, durationMinutes = 60 } = req.body;
    if (!fingerprint || !reason) {
      return res.status(400).json({ success: false, error: 'Fingerprint and reason cannot be empty' });
    }

    const result = alertNoiseReductionService.manuallySuppressAlert(
      fingerprint,
      reason,
      durationMinutes
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'Corresponding alert not found' });
    }

    res.json({ success: true, message: 'Alert suppressed' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to suppress alert' });
  }
});

router.post('/cleanup', (req: Request, res: Response) => {
  try {
    const { daysToKeep = 30 } = req.body;
    const deletedCount = alertNoiseReductionService.cleanupOldRecords(daysToKeep);
    res.json({ success: true, data: { deletedCount } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to cleanup old records' });
  }
});

export default router;
