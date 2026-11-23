import { logger } from '../../../utils/logger';
import { getDefaultModel } from '../../ai/services/models/aiModelService';
import { callLLMAPI, buildProviderConfig } from '../../ai/services/llm/llmService/providerAdapters';

// ── Type Definitions ──

export interface TerminalRound {
  input: string;
  output: string;
}

export interface AIAnalysisRequest {
  sessionId: string;
  rounds: TerminalRound[];
  triggeredBy: 'auto' | 'manual';
  errorDetected: boolean;
}

export interface AIAnalysisResult {
  suggestion: string;
  severity: 'info' | 'warning' | 'error';
  relatedCommands: string[];
}

// ── System Prompt ──

const SYSTEM_PROMPT = `You are a senior Linux operations expert and SRE engineer.
The user executes commands in a Web Terminal, and your task is to analyze the terminal output and provide assistance.

Rules:
1. If the output contains errors, explain the error cause and provide fix commands
2. If the output is normal but can be optimized, provide optimization suggestions
3. If the output is empty, suggest possible next steps
4. Each suggestion must include 1-3 executable commands
5. Response format must be strict JSON, no extra text:
   {"suggestion":"...","severity":"info|warning|error","relatedCommands":["cmd1","cmd2"]}
6. Be concise and direct, each suggestion no more than 3 sentences, no markdown format
7. Reply in English`;

// ── Error Detection Patterns (for frontend detection, backend retains a copy for manual triggers) ──

const ERROR_PATTERNS = [
  /error:/i,
  /EACCES/i,
  /ENOENT/i,
  /permission denied/i,
  /command not found/i,
  /connection refused/i,
  /no such file/i,
  /timeout/i,
  /timed out/i,
  /ETIMEDOUT/i,
  /killed/i,
  /out of memory/i,
  /segmentation fault/i,
  /fatal:/i,
  /cannot/i,
  /failed/i,
  /denied/i,
];

// ── Service Class ──

export class TerminalAiService {
  private static readonly AI_TIMEOUT_MS = 15000;

  /**
   * Detect if terminal output contains errors/exceptions
   */
  detectError(output: string): boolean {
    return ERROR_PATTERNS.some((pattern) => pattern.test(output));
  }

  /**
   * Build User Prompt
   */
  private buildPrompt(request: AIAnalysisRequest): string {
    const parts: string[] = [];

    if (request.rounds.length > 0) {
      parts.push('Here are the recent rounds of terminal interaction records:');
      parts.push('---');

      for (let i = 0; i < request.rounds.length; i++) {
        const round = request.rounds[i];
        const isLast = i === request.rounds.length - 1;
        parts.push(`\n[Round ${i + 1}]`);
        parts.push(`Input: ${round.input}`);
        parts.push(`Output: ${round.output || '(no output)'}`);
        if (isLast && request.errorDetected) {
          parts.push('⚠️ Errors/exceptions detected in the previous round of output; please focus your analysis.');
        }
      }
      parts.push('---');
    }

    if (request.triggeredBy === 'manual') {
      parts.push('\\nUser manually requested analysis of current terminal content.');
    }

    parts.push('\\nBased on the above terminal interaction records, please provide your analysis and recommendations.');

    return parts.join('\n');
  }

  /**
   * Fallback suggestion (returned when AI is unavailable)
   */
  private fallbackSuggestion(request: AIAnalysisRequest): AIAnalysisResult {
    if (request.errorDetected) {
      return {
        suggestion: 'Command execution exception detected. It is recommended to check command syntax, file permissions, or network connectivity. You can try viewing detailed logs to locate the issue.',
        severity: 'warning',
        relatedCommands: ['history | tail -20', 'echo $?', 'journalctl -xe --no-pager | tail -30'],
      };
    }
    return {
      suggestion: 'Current terminal is running normally. For assistance, you can manually trigger analysis or enter specific commands.',
      severity: 'info',
      relatedCommands: ['df -h', 'free -h', 'top -bn1 | head -20'],
    };
  }

  /**
   * Analyze terminal content and return AI suggestions
   */
  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    // 1. Get default model
    const model = getDefaultModel();
    if (!model || !model.enabled) {
      logger.warn('[TerminalAI] No default AI model configured');
      return {
        suggestion: 'Please configure and enable a default AI model in System Settings → AI Models first.',
        severity: 'warning',
        relatedCommands: [],
      };
    }

    // 2. Build prompt
    const userPrompt = this.buildPrompt(request);

    logger.info(`[TerminalAI] Analyzing session ${request.sessionId}, rounds=${request.rounds.length}, trigger=${request.triggeredBy}`);

    try {
      // 3. Call AI (with timeout)
      const config = buildProviderConfig(model);
      const aiResponse = await Promise.race([
        callLLMAPI(config, SYSTEM_PROMPT, userPrompt, 'TerminalAI', 0.3, 'terminal-ai-assistant'),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('AI invocation timeout')), TerminalAiService.AI_TIMEOUT_MS)
        ),
      ]);

      // 4. Parse JSON response
      return this.parseResponse(aiResponse, request);
    } catch (error) {
      logger.error('[TerminalAI] AI call failed:', error);
      return this.fallbackSuggestion(request);
    }
  }

  /**
   * Parse AI returned JSON
   */
  private parseResponse(raw: string, request: AIAnalysisRequest): AIAnalysisResult {
    try {
      // Try to extract JSON from response (AI may add text before/after JSON)
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('[TerminalAI] No JSON found in response, using raw text');
        return {
          suggestion: raw.trim().substring(0, 500),
          severity: request.errorDetected ? 'warning' : 'info',
          relatedCommands: [],
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        suggestion: String(parsed.suggestion || ''),
        severity: ['info', 'warning', 'error'].includes(parsed.severity)
          ? (parsed.severity as AIAnalysisResult['severity'])
          : 'info',
        relatedCommands: Array.isArray(parsed.relatedCommands)
          ? parsed.relatedCommands.slice(0, 3)
          : [],
      };
    } catch {
      logger.warn('[TerminalAI] Failed to parse AI response as JSON');
      return {
        suggestion: raw.trim().substring(0, 500),
        severity: request.errorDetected ? 'warning' : 'info',
        relatedCommands: [],
      };
    }
  }
}

export const terminalAiService = new TerminalAiService();
