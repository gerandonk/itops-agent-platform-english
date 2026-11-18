/**
 * 双层 Agent 架构模块
 * Coordinator + Specialist
 */

export * from './types';
export * from './SpecialistBase';
export * from './SpecialistRegistry';
export * from './Coordinator';
export * from './Specialists';

import { Coordinator } from './Coordinator';
import { specialistRegistry } from './SpecialistRegistry';
import { registerAllSpecialists } from './Specialists';
import { logger } from '../../../../utils/logger';

let globalCoordinator: Coordinator | null = null;

/**
 * 初始化双层 Agent 系统
 */
export function initializeMultiAgentSystem(): Coordinator {
  if (globalCoordinator) {
    logger.info('⚠️ Dual-layer Agent system already initialized, skipping');
    return globalCoordinator;
  }

  logger.info('🚀 Initializing dual-layer Agent system...');

  // 注册所有 Specialist
  registerAllSpecialists(specialistRegistry);

  // 创建 Coordinator
  globalCoordinator = new Coordinator();

  logger.info('✅ Dual-layer Agent system initialized');
  return globalCoordinator;
}

/**
 * 获取全局 Coordinator
 */
export function getCoordinator(): Coordinator {
  if (!globalCoordinator) {
    return initializeMultiAgentSystem();
  }
  return globalCoordinator;
}

/**
 * 便捷方法：执行任务
 */
export async function executeTask(input: string, userId?: string) {
  const coordinator = getCoordinator();
  return coordinator.executeTask(input, userId);
}
