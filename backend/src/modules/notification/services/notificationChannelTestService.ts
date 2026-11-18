/**
 * notificationChannelTestService — 通知渠道测试 service
 *
 * 把 notificationConfigRoutes 中"测试通知渠道"的 switch 业务逻辑集中到 service：
 *   - email    : 使用入参 SMTP 配置发测试邮件
 *   - wechat   : 调用 sendWeCom 推 webhook
 *   - dingtalk : 调用 sendDingTalk 推 webhook
 *
 * 调用方：
 *   - modules/notification/routes/notificationConfigRoutes.ts
 */

import nodemailer from 'nodemailer';
import { sendWeCom, sendDingTalk } from './notificationChannels';

export type ChannelName = 'email' | 'wechat' | 'dingtalk';

export interface EmailTestInput {
  smtp_host?: string;
  smtp_port?: number;
  user?: string;
  password?: string;
  to?: string;
}

export interface WebhookTestInput {
  webhook_url?: string;
}

export interface ChannelTestResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * 测试邮件渠道（不入 settings，纯粹用入参 SMTP 配置发测试邮件）。
 */
export async function testEmailChannel(input: EmailTestInput): Promise<ChannelTestResult> {
  if (!input.smtp_host || !input.user) {
    return { success: false, error: 'SMTP server and email account cannot be empty' };
  }

  const port = input.smtp_port || 465;
  const transporter = nodemailer.createTransport({
    host: input.smtp_host,
    port,
    secure: port === 465,
    auth: { user: input.user, pass: input.password || '' },
  });

  await transporter.sendMail({
    from: `"ITOps Agent" <${input.user}>`,
    to: input.to || input.user,
    subject: '🔔 ITOps Agent Platform - Notification Channel Test',
    text: 'This is a test email proving that the email notification configuration is correct.\\n\\nIf you receive this email, it means the SMTP configuration is active.',
    html: '<h2>✅ Notification Configuration Test</h2><p>This is a test email proving that the email notification configuration is correct.</p><hr/><small>ITOps Agent Platform</small>',
  });

  return { success: true, message: 'Test email sent successfully' };
}

/**
 * 测试企业微信渠道。
 */
export async function testWechatChannel(input: WebhookTestInput): Promise<ChannelTestResult> {
  if (!input.webhook_url) {
    return { success: false, error: 'WeCom Webhook URL cannot be empty' };
  }
  await sendWeCom(input.webhook_url, {
    title: '🔔 ITOps Agent - Notification Channel Test',
    content: 'This is a test message proving that the WeCom notification configuration is correct.\\n> Time: ' + new Date().toLocaleString(),
    severity: 'info',
    source: 'ITOps Platform',
  });
  return { success: true, message: 'WeCom test message sent successfully' };
}

/**
 * 测试钉钉渠道。
 */
export async function testDingtalkChannel(input: WebhookTestInput): Promise<ChannelTestResult> {
  if (!input.webhook_url) {
    return { success: false, error: 'DingTalk Webhook URL cannot be empty' };
  }
  await sendDingTalk(input.webhook_url, {
    title: '🔔 ITOps Agent - Notification Channel Test',
    content: 'This is a test message proving that the DingTalk notification configuration is correct.',
    severity: 'info',
    source: 'ITOps Platform',
  });
  return { success: true, message: 'DingTalk test message sent successfully' };
}

/**
 * 渠道测试统一入口。
 */
export async function testNotificationChannel(
  channel: string,
  body: Record<string, unknown>
): Promise<ChannelTestResult & { unknown?: true }> {
  switch (channel) {
    case 'email':
      return testEmailChannel(body as EmailTestInput);
    case 'wechat':
      return testWechatChannel(body as WebhookTestInput);
    case 'dingtalk':
      return testDingtalkChannel(body as WebhookTestInput);
    default:
      return { success: false, error: `未知的通知渠道: ${channel}`, unknown: true };
  }
}

export const notificationChannelTestService = {
  testEmailChannel,
  testWechatChannel,
  testDingtalkChannel,
  testNotificationChannel,
};

export default notificationChannelTestService;