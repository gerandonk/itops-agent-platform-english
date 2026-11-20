/**
 * =============================================================================
 * 容器监控 - REST 路由
 * =============================================================================
 * 提供 /docker-monitor/* 端点：
 *   - GET  /cluster-snapshot   一次性集群聚合指标
 *   - POST /start/:id          启动对指定容器的实时监控（推送走 socket.io container:stats）
 *   - POST /stop/:id           停止对指定容器的实时监控
 *
 * 实时数据流通过 WebSocket 推送，前端订阅事件 'container:stats'。
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { containerMonitorService } from '../services/containerMonitorService';
import { getErrorMessage } from '../../../utils/errorHelpers';

const router = Router();

/** GET /cluster-snapshot — 集群聚合快照 */
router.get('/cluster-snapshot', async (req: Request, res: Response) => {
  try {
    const endpointId = req.query.endpointId as string | undefined;
    const snapshot = await containerMonitorService.getClusterSnapshot(endpointId);
    res.json({ success: true, data: snapshot });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: getErrorMessage(err) });
  }
});

/** POST /start/:id — 启动容器实时监控（推送走 socket.io） */
router.post('/start/:id', (req: Request, res: Response) => {
  try {
    const intervalMs = req.query.intervalMs
      ? parseInt(req.query.intervalMs as string)
      : 5000;
    const endpointId = req.query.endpointId as string | undefined;
    containerMonitorService.startMonitoring(req.params.id, intervalMs, endpointId);
    res.json({ success: true, message: `Started monitoring container ${req.params.id}` });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: getErrorMessage(err) });
  }
});

/** POST /stop/:id — 停止容器实时监控 */
router.post('/stop/:id', (req: Request, res: Response) => {
  try {
    containerMonitorService.stopMonitoring(req.params.id);
    res.json({ success: true, message: `Stopped monitoring container ${req.params.id}` });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: getErrorMessage(err) });
  }
});

export default router;
