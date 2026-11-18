import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image, RefreshCw, Download, Trash2, X } from 'lucide-react';
import api from '../../../lib/api';
import { useToast } from '../../../contexts/ToastContext';
import type { ImageItem } from './types';
import { formatBytes, formatDate, imageRepo, imageTagOnly } from './types';

// ── Props ──────────────────────────────────────────────

interface ImageSectionProps {
  endpointId: string;
}

// ── Component ──────────────────────────────────────────

export function ImageSection({ endpointId }: ImageSectionProps) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [showPullModal, setShowPullModal] = useState(false);
  const [pullImageName, setPullImageName] = useState('');

  // ═══ QUERIES ═══════════════════════════════════════════

  const imagesQueryKey = ['containers-images', endpointId];
  const { data: images = [], isLoading: imagesLoading, error: imagesError } = useQuery<ImageItem[]>({
    queryKey: imagesQueryKey,
    queryFn: async () => {
      const { data } = await api.get('/containers/images/list', {
        params: { endpointId: endpointId !== 'local' ? endpointId : undefined },
      });
      return data || [];
    },
  });

  // ═══ MUTATIONS ═════════════════════════════════════════

  const pullImageMutation = useMutation({
    mutationFn: () =>
      api.post('/containers/images/pull', { image: pullImageName }, {
        params: { endpointId: endpointId !== 'local' ? endpointId : undefined },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: imagesQueryKey });
      toast.success('Image pulled');
      setShowPullModal(false);
      setPullImageName('');
    },
    onError: () => toast.error('Image pull failed'),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/containers/images/${id}`, {
        params: { endpointId: endpointId !== 'local' ? endpointId : undefined },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: imagesQueryKey });
      toast.success('Image deleted');
    },
    onError: () => toast.error('Image deletion failed'),
  });

  // ═══ RENDER ═══════════════════════════════════════════

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: imagesQueryKey })}
          className="px-3 py-2 bg-surface border border-border rounded-lg text-text-primary hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
        <button
          onClick={() => setShowPullModal(true)}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 text-sm transition-colors"
        >
          <Download className="w-4 h-4" /> Pull Image
        </button>
      </div>

      {imagesError && (
        <div className="flex flex-col items-center justify-center py-20">
          <Image className="w-16 h-16 text-text-tertiary mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Image service unavailable</h3>
          <p className="text-text-secondary text-sm mb-4">Failed to connect to Docker engine.</p>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: imagesQueryKey })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      {!imagesError && (
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Repository</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Tags</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Image ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden md:table-cell">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden lg:table-cell">Created At</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {imagesLoading ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-text-tertiary">Loading...</td></tr>
                ) : images.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-text-tertiary">No images</td></tr>
                ) : (
                  images.map((img) => (
                    <tr key={img.Id || img.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm text-text-primary truncate max-w-[200px]">{imageRepo(img)}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">{imageTagOnly(img)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs text-text-tertiary font-mono">{(img.Id || img.id || '').substring(0, 12)}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-text-secondary">{formatBytes(img.Size || 0)}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-xs text-text-secondary">{formatDate(img.Created)}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => { if (confirm('Delete this image?')) deleteImageMutation.mutate(img.Id || img.id || ''); }}
                          className="p-1.5 rounded hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors"
                          title="Delete"
                        ><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pull Image Modal ── */}
      {showPullModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowPullModal(false); setPullImageName(''); }}>
          <div className="bg-surface rounded-lg border border-border w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">Pull image</h3>
              <button onClick={() => { setShowPullModal(false); setPullImageName(''); }} className="text-text-secondary hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Image name <span className="text-red-400">*</span></label>
                <input type="text" value={pullImageName} onChange={(e) => setPullImageName(e.target.value)} placeholder="nginx:latest" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowPullModal(false); setPullImageName(''); }} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-text-primary rounded-lg transition-colors text-sm">Cancel</button>
                <button onClick={() => pullImageMutation.mutate()} disabled={!pullImageName.trim() || pullImageMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {pullImageMutation.isPending ? 'Pulling...' : <><Download className="w-4 h-4" /> Pull</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
