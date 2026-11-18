/**
 * Kubernetes 命名空间选择器
 *
 * 从原 Kubernetes.tsx 抽离（2026-07-08 增量-13）。
 * 含：命名空间下拉框 + 加载状态 + 空状态。
 */

import { ChevronDown } from 'lucide-react';
import type { Namespace } from './types';

interface NamespaceSelectorProps {
  effectiveNamespace: string;
  namespacesLoading: boolean;
  namespaces: Namespace[];
  onNamespaceChange: (ns: string) => void;
}

export function NamespaceSelector({
  effectiveNamespace,
  namespacesLoading,
  namespaces,
  onNamespaceChange,
}: NamespaceSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-text-secondary text-sm shrink-0">Namespace:</span>
      <div className="relative">
        <select
          value={effectiveNamespace}
          onChange={(e) => onNamespaceChange(e.target.value)}
          className="appearance-none bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2 pr-8 min-w-[220px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
        >
          {namespacesLoading ? (
            <option>Loading...</option>
          ) : namespaces.length === 0 ? (
            <option value="">No Namespace</option>
          ) : (
            <>
              <option value="">All Namespaces</option>
              {namespaces.map((ns) => (
                <option key={ns.name} value={ns.name}>{ns.name}</option>
              ))}
            </>
          )}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
      </div>
    </div>
  );
}

export default NamespaceSelector;
