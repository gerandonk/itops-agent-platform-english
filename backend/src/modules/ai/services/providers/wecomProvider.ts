import type { Provider, ProviderResult } from './types';

/**
 * 企业微信 Provider
 */
export const wecomProvider: Provider = {
  name: 'wecom',
  description: 'WeCom Notification Provider',
  version: '1.0.0',
  methods: [
    {
      name: 'sendText',
      description: 'Send text message',
      inputs: [
        { name: 'webhook', type: 'string', description: 'WeCom Group Bot Webhook', required: true },
        { name: 'content', type: 'string', description: 'Message Content', required: true },
        { name: 'mentionedList', type: 'array', description: '@ User ID List' },
        { name: 'mentionedMobileList', type: 'array', description: '@ Phone Number List' }
      ],
      outputs: [
        { name: 'errcode', type: 'number' },
        { name: 'errmsg', type: 'string' }
      ],
      examples: []
    },
    {
      name: 'sendMarkdown',
      description: 'Send Markdown message',
      inputs: [
        { name: 'webhook', type: 'string', description: 'WeCom Group Bot Webhook', required: true },
        { name: 'content', type: 'string', description: 'Markdown Content', required: true }
      ],
      outputs: [
        { name: 'errcode', type: 'number' },
        { name: 'errmsg', type: 'string' }
      ],
      examples: []
    },
    {
      name: 'sendNews',
      description: 'Send News Message',
      inputs: [
        { name: 'webhook', type: 'string', description: 'WeCom Group Bot Webhook', required: true },
        { name: 'articles', type: 'array', description: 'News List', required: true }
      ],
      outputs: [
        { name: 'errcode', type: 'number' },
        { name: 'errmsg', type: 'string' }
      ],
      examples: []
    }
  ]
};

// 企业微信方法实现
export const wecomMethods = {
  async sendText(params: Record<string, unknown>): Promise<ProviderResult> {
    try {
      const body = {
        msgtype: 'text',
        text: {
          content: params.content,
          mentioned_list: params.mentionedList || [],
          mentioned_mobile_list: params.mentionedMobileList || []
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
        markdown: { content: params.content }
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

  async sendNews(params: Record<string, unknown>): Promise<ProviderResult> {
    try {
      const body = {
        msgtype: 'news',
        news: { articles: params.articles }
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