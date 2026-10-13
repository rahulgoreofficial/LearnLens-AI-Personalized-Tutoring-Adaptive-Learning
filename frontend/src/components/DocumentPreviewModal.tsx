import React, { useEffect, useState } from 'react';
import { X, FileText, Layers, Tag, ShieldCheck, Loader2 } from 'lucide-react';
import { MaterialMetadata, DocumentChunk } from '../types';
import { fetchMaterialDetail } from '../api/client';

interface DocumentPreviewModalProps {
  material: MaterialMetadata | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  material,
  onClose,
}) => {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!material) return;
    setLoading(true);
    fetchMaterialDetail(material.id)
      .then((data) => setChunks(data.chunks))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [material]);

  if (!material) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="flex flex-col h-[85vh] w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{material.title}</h3>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 uppercase">
                  {material.doc_type}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {material.total_pages_or_slides
                  ? `${material.total_pages_or_slides} ${material.doc_type === 'pdf' ? 'Pages' : 'Slides'}`
                  : material.total_duration
                  ? `Duration: ${material.total_duration}`
                  : 'Document'}{' '}
                • {material.chunk_count} Indexed Chunks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Topics strip */}
        {material.topics.length > 0 && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-950/20 border-b border-slate-800/60 overflow-x-auto">
            <Tag className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="text-[11px] font-medium text-slate-400 shrink-0">Topics:</span>
            {material.topics.map((t, idx) => (
              <span
                key={idx}
                className="shrink-0 rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] text-slate-300 border border-slate-700/60"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Chunks List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-950/50">
          <div className="flex items-center justify-between pb-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Layers className="h-4 w-4 text-indigo-400" />
              Extracted Chunks with Source Provenance
            </span>
            <span className="text-xs text-slate-500">Showing {chunks.length} chunks</span>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            </div>
          ) : (
            chunks.map((chunk, idx) => (
              <div
                key={chunk.chunk_id || idx}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-slate-700"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    <span className="rounded bg-indigo-500/10 px-2 py-0.5 font-semibold text-indigo-300 border border-indigo-500/20">
                      {chunk.locator}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <ShieldCheck className="h-3 w-3" />
                    Indexed ({chunk.char_count} chars)
                  </span>
                </div>
                <p className="text-xs font-mono leading-relaxed text-slate-300 whitespace-pre-wrap">
                  {chunk.text}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
