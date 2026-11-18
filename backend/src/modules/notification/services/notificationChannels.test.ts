import { describe, expect, it } from 'vitest';
import { CHANNEL_NAMES } from './notificationChannels';

describe('notificationChannels', () => {
  it('CHANNEL_NAMES should have expected channel mappings', () => {
    expect(CHANNEL_NAMES.feishu).toBe('Feishu');
    expect(CHANNEL_NAMES.wecom).toBe('WeCom');
    expect(CHANNEL_NAMES.dingtalk).toBe('DingTalk');
    expect(CHANNEL_NAMES.telegram).toBe('Telegram');
    expect(CHANNEL_NAMES.email).toBe('Email');
    expect(CHANNEL_NAMES.webhook).toBe('Webhook');
  });

  it('should have all 6 channel types defined', () => {
    const keys = Object.keys(CHANNEL_NAMES);
    expect(keys).toHaveLength(6);
    expect(keys).toContain('feishu');
    expect(keys).toContain('wecom');
    expect(keys).toContain('dingtalk');
    expect(keys).toContain('telegram');
    expect(keys).toContain('email');
    expect(keys).toContain('webhook');
  });
});