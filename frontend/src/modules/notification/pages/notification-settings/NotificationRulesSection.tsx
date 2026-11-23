/**
 * 通知规则 section（告警 + 任务）（2026-07-21 拆分）
 *
 * 从原 NotificationSettings.tsx L478-555 抽出
 * 包含：告警 critical/warning/info 通知 toggle + 任务 success/failed/running 通知 toggle
 *
 * 拆分原则遵循 ADR-031 §二.3 模式 3 + lessons-learned §3.5
 */
import { ToggleSwitch } from './ToggleSwitch';
import type { NotificationConfig } from './types';

export interface NotificationRulesSectionProps {
  config: NotificationConfig;
  onChange: (updater: Partial<NotificationConfig>) => void;
}

export function NotificationRulesSection({
  config,
  onChange,
}: NotificationRulesSectionProps) {
  return (
    <>
      {/* ==================== Alert Notification Filter ==================== */}
      <div className="bg-background rounded-lg p-4">
        <h4 className="font-medium text-text-primary mb-4">Alert Notifications</h4>
        <p className="text-xs text-text-secondary mb-3">Select alert severities to notify</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap">
            <p className="text-sm text-text-secondary">Critical alert (critical)</p>
            <ToggleSwitch
              checked={config.alert_notification.critical}
              onChange={(b) =>
                onChange({
                  alert_notification: { ...config.alert_notification, critical: b },
                })
              }
              ariaLabel="Enable critical notifications"
            />
          </div>
          <div className="flex items-center justify-between flex-wrap">
            <p className="text-sm text-text-secondary">Warning alert (warning)</p>
            <ToggleSwitch
              checked={config.alert_notification.warning}
              onChange={(b) =>
                onChange({
                  alert_notification: { ...config.alert_notification, warning: b },
                })
              }
              ariaLabel="Enable warning notifications"
            />
          </div>
          <div className="flex items-center justify-between flex-wrap">
            <p className="text-sm text-text-secondary">Info alert (info)</p>
            <ToggleSwitch
              checked={config.alert_notification.info}
              onChange={(b) =>
                onChange({
                  alert_notification: { ...config.alert_notification, info: b },
                })
              }
              ariaLabel="Enable info notifications"
            />
          </div>
        </div>
      </div>

      {/* ==================== Task Notification Filter ==================== */}
      <div className="bg-background rounded-lg p-4">
        <h4 className="font-medium text-text-primary mb-4">Task Notifications</h4>
        <p className="text-xs text-text-secondary mb-3">Select task statuses to notify</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap">
            <p className="text-sm text-text-secondary">Task succeeded</p>
            <ToggleSwitch
              checked={config.task_notification.success}
              onChange={(b) =>
                onChange({
                  task_notification: { ...config.task_notification, success: b },
                })
              }
              ariaLabel="Enable task success notifications"
            />
          </div>
          <div className="flex items-center justify-between flex-wrap">
            <p className="text-sm text-text-secondary">Task failed</p>
            <ToggleSwitch
              checked={config.task_notification.failed}
              onChange={(b) =>
                onChange({
                  task_notification: { ...config.task_notification, failed: b },
                })
              }
              ariaLabel="Enable task failure notifications"
            />
          </div>
          <div className="flex items-center justify-between flex-wrap">
            <p className="text-sm text-text-secondary">Task running</p>
            <ToggleSwitch
              checked={config.task_notification.running}
              onChange={(b) =>
                onChange({
                  task_notification: { ...config.task_notification, running: b },
                })
              }
              ariaLabel="Enable task running notifications"
            />
          </div>
        </div>
      </div>
    </>
  );
}
