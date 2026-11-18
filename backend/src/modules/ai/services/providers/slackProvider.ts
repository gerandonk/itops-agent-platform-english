import type { Provider, ProviderResult } from './types';

/**
 * Slack Provider
 */
export const slackProvider: Provider = {
  name: 'slack',
  description: 'Slack Notification Provider',
  version: '1.0.0',
  methods: [
    {
      name: 'sendMessage',
      description: 'Send message',
      inputs: [
        { name: 'webhook', type: 'string', description: 'Slack Webhook URL', required: true },
        { name: 'text', type: 'string', description: 'Message Content', required: true },
        { name: 'channel', type: 'string', description: 'Channel' },
        { name: 'username', type: 'string', description: 'Username' },
        { name: 'iconEmoji', type: 'string', description: 'Icon' }
      ],
      outputs: [
        { name: 'ok', type: 'boolean' }
      ],
      examples: []
    },
    {
      name: 'sendBlocks',
      description: 'Send Block Message',
      inputs: [
        { name: 'webhook', type: 'string', description: 'Slack Webhook URL', required: true },
        { name: 'blocks', type: 'array', description: 'Block Content', required: true },
        { name: 'text', type: 'string', description: 'Fallback Text' },
        { name: 'channel', type: 'string', description: 'Channel' }
      ],
      outputs: [
        { name: 'ok', type: 'boolean' }
      ],
      examples: []
    },
    {
      name: 'sendAttachments',
      description: 'Send Attachment Message',
      inputs: [
        { name: 'webhook', type: 'string', description: 'Slack Webhook URL', required: true },
        { name: 'attachments', type: 'array', description: 'Attachment List', required: true },
        { name: 'channel', type: 'string', description: 'Channel' }
      ],
      outputs: [
        { name: 'ok', type: 'boolean' }
      ],
      examples: []
    }
  ]
};

// Slack 方法实现
export const slackMethods = {
  async sendMessage(params: Record<string, unknown>): Promise<ProviderResult> {
    try {
      const body: Record<string, unknown> = { text: params.text };
      if (params.channel) body.channel = params.channel;
      if (params.username) body.username = params.username;
      if (params.iconEmoji) body.icon_emoji = params.iconEmoji;

      const response = await fetch(params.webhook as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const ok = response.ok;

      return {
        success: ok,
        data: { ok }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  async sendBlocks(params: Record<string, unknown>): Promise<ProviderResult> {
    try {
      const body: Record<string, unknown> = { blocks: params.blocks };
      if (params.text) body.text = params.text;
      if (params.channel) body.channel = params.channel;

      const response = await fetch(params.webhook as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const ok = response.ok;

      return {
        success: ok,
        data: { ok }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  async sendAttachments(params: Record<string, unknown>): Promise<ProviderResult> {
    try {
      const body: Record<string, unknown> = { attachments: params.attachments };
      if (params.channel) body.channel = params.channel;

      const response = await fetch(params.webhook as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const ok = response.ok;

      return {
        success: ok,
        data: { ok }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};