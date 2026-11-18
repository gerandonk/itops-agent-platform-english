import type { Provider, ProviderResult } from './types';

/**
 * 钉钉 Provider
 */
export const dingtalkProvider: Provider = {
  name: 'dingtalk',
  description: 'DingTalk Notification Provider',
  version: '1.0.0',
  methods: [
    {
      name: 'sendText',
      description: 'Send text message',
      inputs: [
        { name: 'webhook', type: 'string', description: 'DingTalk Bot Webhook', required: true },
        { name: 'content', type: 'string', description: 'Message Content', required: true },
        { name: 'atMobiles', type: 'array', description: '@ Phone Number List' },
        { name: 'isAtAll', type: 'boolean', description: '@ All' }
      ],
      outputs: [
        { name: 'errcode', type: 'number' },
        { name: 'errmsg', type: 'string' }
      ],
      examples: [
        {
          title: 'Send alert notification',
          inputs: {
            webhook: 'https://oapi.dingtalk.com/robot/send?access_token=xxx',
            content: '⚠️ Server CPU utilization alert, please handle promptly!',
            isAtAll: false
          }
        }
      ]
    },
    {
      name: 'sendMarkdown',
      description: 'Send Markdown message',
      inputs: [
        { name: 'webhook', type: 'string', description: 'DingTalk Bot Webhook', required: true },
        { name: 'title', type: 'string', description: 'Title', required: true },
        { name: 'text', type: 'string', description: 'Markdown Content', required: true },
        { name: 'atMobiles', type: 'array', description: '@ Phone Number List' },
        { name: 'isAtAll', type: 'boolean', description: '@ All' }
      ],
      outputs: [
        { name: 'errcode', type: 'number' },
        { name: 'errmsg', type: 'string' }
      ],
      examples: []
    },
    {
      name: 'sendCard',
      description: 'Send Card Message',
      inputs: [
        { name: 'webhook', type: 'string', description: 'DingTalk Bot Webhook', required: true },
        { name: 'title', type: 'string', description: 'Title', required: true },
        { name: 'text', type: 'string', description: 'Content', required: true },
        { name: 'singleTitle', type: 'string', description: 'Button Text' },
        { name: 'singleURL', type: 'string', description: 'Button Link' }
      ],
      outputs: [
        { name: 'errcode', type: 'number' },
        { name: 'errmsg', type: 'string' }
      ],
      examples: []
    }
  ]
};

// 钉钉方法实现
export const dingtalkMethods = {
  async sendText(params: Record<string, unknown>): Promise<ProviderResult> {
    try {
      const body = {
        msgtype: 'text',
        text: { content: params.content },
        at: {
          atMobiles: params.atMobiles || [],
          isAtAll: params.isAtAll || false
        }
      };

      const response = await fetch(params.webhook as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json() as Record<string, unknown>;

      return {
        success: data.errcode === 0,
        data: {
          errcode: data.errcode,
          errmsg: data.errmsg
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  async sendMarkdown(params: Record<string, unknown>): Promise<ProviderResult> {
    try {
      const body = {
        msgtype: 'markdown',
        markdown: { title: params.title, text: params.text },
        at: {
          atMobiles: params.atMobiles || [],
          isAtAll: params.isAtAll || false
        }
      };

      const response = await fetch(params.webhook as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json() as Record<string, unknown>;

      return {
        success: data.errcode === 0,
        data: {
          errcode: data.errcode,
          errmsg: data.errmsg
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  async sendCard(params: Record<string, unknown>): Promise<ProviderResult> {
    try {
      const body = {
        msgtype: 'actionCard',
        actionCard: {
          title: params.title,
          text: params.text,
          singleTitle: params.singleTitle,
          singleURL: params.singleURL
        }
      };

      const response = await fetch(params.webhook as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json() as Record<string, unknown>;

      return {
        success: data.errcode === 0,
        data: {
          errcode: data.errcode,
          errmsg: data.errmsg
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};