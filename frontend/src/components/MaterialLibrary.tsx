import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Presentation,
  Film,
  FileCode,
  Video,
  Trash2,
  Eye,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Database,
  Calendar,
  Layers,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { MaterialMetadata } from '../types';
import { uploadMaterial, importYouTube, deleteMaterial } from '../api/client';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface MaterialLibraryProps {
  materials: MaterialMetadata[];
  onRefresh: () => void;
  onSeedSamples: () => void;
  isSeeding: boolean;
}

export const MaterialLibrary: React.FC<MaterialLibraryProps> = ({
  materials,
  onRefresh,
  onSeedSamples,
  isSeeding,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialMetadata | null>(null);

  // YouTube import modal state
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [isImportingYt, setIsImportingYt] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);
    setSuccessMsg(null);

    try {
      for (let i = 0; i < files.length; i++) {
        await uploadMaterial(files[i]);
      }
      setSuccessMsg(`Successfully processed and indexed ${files.length} document(s)!`);
      onRefresh();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) {
      setYtError('Please provide a valid YouTube lecture URL');
      return;
    }

    setIsImportingYt(true);
    setYtError(null);

    try {
      await importYouTube(youtubeUrl.trim(), youtubeTitle.trim() || undefined);
      setShowYoutubeModal(false);
      setYoutubeUrl('');
      setYoutubeTitle('');
      setSuccessMsg('YouTube lecture transcript imported with timestamps!');
      onRefresh();
    } catch (err: any) {
      setYtError(err.message || 'Failed to import YouTube transcript');
    } finally {
      setIsImportingYt(false);
    }
  };

  const handleDelete = async (materialId: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from your library?`)) return;
    try {
      await deleteMaterial(materialId);
      onRefresh();
    } catch (err: any) {
      alert(`Error deleting material: ${err.message}`);
    }
  };

  const getDocIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-rose-400" />;
      case 'pptx':
        return <Presentation className="h-6 w-6 text-amber-400" />;
      case 'transcript':
        return <Film className="h-6 w-6 text-cyan-400" />;
      case 'youtube':
        return <Video className="h-6 w-6 text-red-400" />;
      default:
        return <FileCode className="h-6 w-6 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Study Material Library
            <span className="text-xs font-normal text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
              {materials.length} Materials
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload textbooks, lecture slides, or transcripts. Text and provenance (pages, slides, timestamps) are preserved automatically.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowYoutubeModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20 transition"
          >
            <Video className="h-4 w-4 text-red-400" />
            <span>Import YouTube</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Files</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.pptx,.txt,.md,.srt,.vtt"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>
      </div>

      {/* Notifications */}
      {uploadError && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{uploadError}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
          isUploading
            ? 'border-indigo-500 bg-indigo-500/5'
            : 'border-slate-800 bg-slate-900/40 hover:border-indigo-500/50 hover:bg-slate-900/70'
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition">
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
        </div>
        <h3 className="mt-3 text-sm font-semibold text-slate-200">
          {isUploading ? 'Extracting text and indexing chunks...' : 'Drag and drop study files, or browse'}
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          Supports PDF Textbooks, PPTX Slides, SRT/VTT Lecture Subtitles, and Markdown Notes (Max 50MB)
        </p>
      </div>

      {/* Materials Grid */}
      {materials.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <Layers className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-3 text-base font-semibold text-slate-300">Your Study Library is Empty</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Upload your lecture slides or notes to build your source-grounded knowledge base, or load our pre-made multimodal sample library.
          </p>
          <button
            onClick={onSeedSamples}
            disabled={isSeeding}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow hover:bg-indigo-500 transition disabled:opacity-50"
          >
            <Database className="h-4 w-4" />
            <span>{isSeeding ? 'Seeding...' : 'Load Sample Multimodal Materials'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((m) => (
            <div
              key={m.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm transition hover:border-slate-700 hover:shadow-indigo-500/5"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/60">
                    {getDocIcon(m.doc_type)}
                  </div>
                  <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300 uppercase tracking-wider border border-slate-700">
                    {m.doc_type}
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-bold text-white line-clamp-1" title={m.title}>
                  {m.title}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5 truncate" title={m.filename}>
                  {m.filename}
                </p>

                {/* Metadata strip */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/80">
                    <Layers className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{m.chunk_count} Chunks</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/80">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span className="truncate">
                      {m.total_pages_or_slides
                        ? `${m.total_pages_or_slides} ${m.doc_type === 'pdf' ? 'Pages' : 'Slides'}`
                        : m.total_duration || m.upload_date}
                    </span>
                  </div>
                </div>

                {/* Topics tags */}
                {m.topics.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {m.topics.slice(0, 3).map((t, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/20"
                      >
                        {t}
                      </span>
                    ))}
                    {m.topics.length > 3 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{m.topics.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => setSelectedMaterial(m)}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  <Eye className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Inspect Chunks</span>
                </button>
                <button
                  onClick={() => handleDelete(m.id, m.title)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                  title="Remove material"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* YouTube Import Modal */}
      {showYoutubeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Import YouTube Lecture</h3>
                <p className="text-xs text-slate-400">Extracts captions with timestamps for citations</p>
              </div>
            </div>

            <form onSubmit={handleYoutubeSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  YouTube Lecture URL or Video ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stanford CS229: Deep Learning Lecture 1"
                  value={youtubeTitle}
                  onChange={(e) => setYoutubeTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                />
              </div>

              {ytError && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{ytError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowYoutubeModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImportingYt}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white shadow hover:bg-red-500 transition disabled:opacity-50"
                >
                  {isImportingYt ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Fetching Captions...</span>
                    </>
                  ) : (
                    <span>Import Lecture</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Chunk Inspector */}
      {selectedMaterial && (
        <DocumentPreviewModal
          material={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
        />
      )}
    </div>
  );
};
