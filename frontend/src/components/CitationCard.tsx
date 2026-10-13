import React, { useState } from 'react';
import {
  FileText,
  Presentation,
  Film,
  FileCode,
  Video,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import { Citation, DocType } from '../types';

interface CitationCardProps {
  citation: Citation;
  index: number;
}

export const CitationCard: React.FC<CitationCardProps> = ({ citation, index }) => {
  const [expanded, setExpanded] = useState(false);

  const getDocIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-rose-400" />;
      case 'pptx':
        return <Presentation className="h-4 w-4 text-amber-400" />;
      case 'transcript':
        return <Film className="h-4 w-4 text-cyan-400" />;
      case 'youtube':
        return <Video className="h-4 w-4 text-red-400" />;
      default:
        return <FileCode className="h-4 w-4 text-emerald-400" />;
    }
  };

  const getDocTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
      case 'pptx':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'transcript':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
      case 'youtube':
        return 'bg-red-500/10 text-red-300 border-red-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 transition hover:border-slate-700/80">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between p-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700">
            {index}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {getDocIcon(citation.doc_type)}
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium border uppercase tracking-wider ${getDocTypeBadge(
                citation.doc_type
              )}`}
            >
              {citation.doc_type}
            </span>
          </div>

          <div className="flex items-baseline gap-2 truncate">
            <span className="text-xs font-medium text-slate-200 truncate">
              {citation.source_title}
            </span>
            <span className="shrink-0 rounded bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-300 border border-indigo-500/20">
              {citation.locator}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
            title="Grounding relevance score"
          >
            <ShieldCheck className="h-3 w-3" />
            {Math.round(citation.relevance_score * 100)}% Match
          </span>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-200 p-1"
            aria-label={expanded ? 'Collapse citation' : 'Expand citation'}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-800/80 bg-slate-950/50 p-3.5 text-xs text-slate-300 rounded-b-xl">
          <div className="flex items-center justify-between pb-2 text-[11px] text-slate-400 font-medium border-b border-slate-800/50 mb-2">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Verified Excerpt from {citation.locator}
            </span>
            <span className="text-slate-500">Relevance: {citation.relevance_score}</span>
          </div>
          <p className="font-mono text-xs leading-relaxed text-slate-200 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            "{citation.snippet}"
          </p>
        </div>
      )}
    </div>
  );
};
