import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

// ── 类型 ──

export interface TerminalRound {
  input: string;
  output: string;
}

export interface AIAnalysisResult {
  suggestion: string;
  severity: 'info' | 'warning' | 'error';
  relatedCommands: string[];
}

interface SuggestionItem extends AIAnalysisResult {
  id: number;
  timestamp: number;
  triggeredBy: 'auto' | 'manual';
}

interface Props {
  sessionId: string | null;
  socket: Socket | null;
  roundHistory: TerminalRound[];
  hasError: boolean;
  onClose: () => void;
}

// ── 错误检测正则（前端侧，和后端保持一致） ──

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
  /cannot bind/i,
  /failed/i,
  /denied/i,
];

// ── 组件 ──

export default function AIAssistantSidebar({ sessionId, socket, roundHistory, hasError, onClose }: Props) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const lastRoundRef = useRef<number>(-1);

  const triggerAnalysis = (triggeredBy: 'auto' | 'manual') => {
    if (!socket?.connected || !sessionId || isAnalyzing || roundHistory.length === 0) return;

    const currentLastIdx = roundHistory.length - 1;
    // 避免重复分析同一轮
    if (triggeredBy === 'auto' && currentLastIdx === lastRoundRef.current) return;

    lastRoundRef.current = currentLastIdx;
    setIsAnalyzing(true);

    // 取最近 5 轮
    const rounds = roundHistory.slice(-5);
    const lastOutput = rounds[rounds.length - 1]?.output || '';
    const errorDetected = ERROR_PATTERNS.some((p) => p.test(lastOutput));

    socket.emit(
      'terminal:ai-analyze',
      {
        sessionId,
        rounds: rounds.map((r) => ({ input: r.input, output: r.output })),
        triggeredBy,
        errorDetected: triggeredBy === 'auto' ? hasError : errorDetected,
      },
      (result: AIAnalysisResult) => {
        setIsAnalyzing(false);
        setSuggestions((prev) => [
          {
            ...result,
            id: Date.now(),
            timestamp: Date.now(),
            triggeredBy,
          },
          ...prev,
        ].slice(0, 20)); // Keep up to 20 history records
      }
    );
  };

  // hasError 变化时自动触发
  useEffect(() => {
    if (hasError && roundHistory.length > 0) {
      triggerAnalysis('auto');
    }
  }, [hasError, roundHistory.length]);

  // ── 渲染 ──

  const severityConfig = {
    error: { bg: 'bg-red-900/40', border: 'border-red-700', text: 'text-red-300', icon: '⚠️', label: 'Error' },
    warning: { bg: 'bg-yellow-900/30', border: 'border-yellow-700', text: 'text-yellow-300', icon: '⚡', label: 'Warning' },
    info: { bg: 'bg-blue-900/30', border: 'border-blue-700', text: 'text-blue-300', icon: '💡', label: 'Suggestion' },
  };

  return (
    <div className="flex flex-col h-full bg-gray-850 border-l border-gray-700 w-[320px] min-w-[280px] max-w-[360px]">
      {/* Title Bar */}
      <div className="flex items-center justify-between flex-wrap px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-base">🧠</span>
          <span className="text-sm font-medium text-gray-200">AI Terminal Assistant</span>
          {isAnalyzing && (
            <span className="text-xs text-yellow-400 animate-pulse">Analyzing...</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors text-lg leading-none px-1"
          title="Close AI assistant"
        >
          ×
        </button>
      </div>

      {/* Manual Trigger Button */}
      <div className="px-3 py-2 border-b border-gray-700/50">
        <button
          onClick={() => triggerAnalysis('manual')}
          disabled={isAnalyzing || !socket?.connected || roundHistory.length === 0}
          className="w-full py-2 px-3 text-xs bg-blue-600/30 hover:bg-blue-600/50 disabled:bg-gray-700/30 disabled:text-gray-500 text-blue-300 border border-blue-700/50 rounded transition-colors"
        >
          {isAnalyzing ? '⏳ AI is analyzing...' : '🔍 Analyze current terminal content'}
        </button>
      </div>

      {/* Suggestion List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {suggestions.length === 0 && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 text-sm text-center px-4">
            <span className="text-3xl mb-3">🤖</span>
            <p className="mb-1">AI Assistant Ready</p>
            <p className="text-xs text-gray-700">
              When a command error is detected, AI automatically analyzes and provides suggestions. You can also manually click the button above to trigger analysis.
            </p>
          </div>
        )}

        {suggestions.map((item) => {
          const config = severityConfig[item.severity];
          return (
            <div
              key={item.id}
              className={`rounded-lg border p-3 text-sm ${config.bg} ${config.border}`}
            >
              {/* Title Row */}
              <div className="flex items-center justify-between flex-wrap mb-2">
                <span className={`text-xs font-medium ${config.text}`}>
                  {config.icon} {config.label}
                  {item.triggeredBy === 'auto' && (
                    <span className="ml-1 text-gray-500">· Auto</span>
                  )}
                </span>
                <span className="text-[10px] text-gray-600">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {/* Suggestion Content */}
              <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">
                {item.suggestion}
              </p>

              {/* Related Commands */}
              {item.relatedCommands.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-700/50">
                  <span className="text-[10px] text-gray-500 block mb-1">Suggested Commands</span>
                  {item.relatedCommands.map((cmd, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 group"
                    >
                      <code className="flex-1 text-xs text-green-400 bg-gray-900/50 px-2 py-1 rounded mt-0.5 font-mono select-all">
                        {cmd}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(cmd).catch(() => {});
                        }}
                        className="text-gray-600 hover:text-gray-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy command"
                      >
                        📋
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Status */}
      <div className="px-3 py-2 border-t border-gray-700/50 flex items-center justify-between flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${socket?.connected ? 'bg-green-500' : 'bg-gray-500'}`} />
          <span className="text-[10px] text-gray-600">
            {socket?.connected ? 'Connected' : 'Disconnected'}
          </span>
          <span className="text-[10px] text-gray-700">· {suggestions.length} suggestions</span>
        </div>
        {suggestions.length > 0 && (
          <button
            onClick={() => setSuggestions([])}
            className="text-[10px] text-gray-600 hover:text-gray-400"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
