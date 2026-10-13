import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  AlertCircle,
  BookOpen,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { AdaptiveProgressResponse } from '../types';
import { resetProgress } from '../api/client';

interface AdaptiveMasteryViewProps {
  progress: AdaptiveProgressResponse | null;
  onRefresh: () => void;
  onPracticeTopic: (topic: string) => void;
}

export const AdaptiveMasteryView: React.FC<AdaptiveMasteryViewProps> = ({
  progress,
  onRefresh,
  onPracticeTopic,
}) => {
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all quiz progress and topic mastery scores?')) return;
    setIsResetting(true);
    try {
      await resetProgress();
      onRefresh();
    } catch (err: any) {
      alert(`Error resetting progress: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const topicMasteries = progress?.topic_mastery || [];

  return (
    <div className="space-y-6">
      {/* Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Adaptive Learning & Topic Mastery
            <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400 border border-indigo-500/20">
              Heuristic Mastery Engine
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tracks recall accuracy, calculates real-time mastery scores, and adapts study recommendations based on your performance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowFormulaInfo(!showFormulaInfo)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
          >
            <Info className="h-4 w-4 text-indigo-400" />
            <span>How Mastery is Calculated</span>
          </button>

          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition disabled:opacity-50"
            title="Reset telemetry for fresh evaluation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Telemetry</span>
          </button>
        </div>
      </div>

      {/* Transparent Calculation Explanation Accordion */}
      {showFormulaInfo && (
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5 text-xs text-slate-300 space-y-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <span>Mastery Score Formula Explanation</span>
          </div>
          <p className="leading-relaxed">
            LearnLens AI avoids black-box scoring. Our transparent algorithm evaluates student recall using weighted multi-factor telemetry:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <span className="text-xs font-bold text-indigo-300">70% Base Accuracy</span>
              <p className="text-[11px] text-slate-400 mt-1">
                Calculated directly as <code className="text-slate-300 font-mono">(Correct / Total) * 70</code> for all questions attempted on this topic.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <span className="text-xs font-bold text-indigo-300">20% Recency Momentum</span>
              <p className="text-[11px] text-slate-400 mt-1">
                Weighted by performance on the student's 3 most recent quiz attempts to reflect active learning gains.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <span className="text-xs font-bold text-indigo-300">10% Difficulty Factor</span>
              <p className="text-[11px] text-slate-400 mt-1">
                Bonus scaling awarded for successfully answering Medium and Hard analytical questions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Weak Topics Targeted Recommendations */}
      {progress && progress.weak_topics.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <span>Priority Practice: Weak Topics Identified</span>
          </div>
          <p className="text-xs text-slate-300">
            Based on your quiz attempts, the following topics have mastery scores below 60%. Target them to strengthen retention:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {progress.weak_topics.map((wt, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 text-xs"
              >
                <div>
                  <span className="font-semibold text-white">{wt}</span>
                  <p className="text-[10px] text-amber-400/80 mt-0.5">Needs Practice</p>
                </div>
                <button
                  onClick={() => onPracticeTopic(wt)}
                  className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white shadow hover:bg-indigo-500 transition"
                >
                  <span>Practice</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic Mastery Grid */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            All Monitored Topics ({topicMasteries.length})
          </h3>
          <span className="text-xs text-slate-400">
            Average Mastery: <strong className="text-white">{progress?.average_mastery || 0}%</strong>
          </span>
        </div>

        {topicMasteries.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No quiz attempts recorded yet. Take a quiz to populate topic mastery telemetry.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topicMasteries.map((tm) => {
              const isMastered = tm.mastery_score >= 80;
              const isInProgress = tm.mastery_score >= 50 && tm.mastery_score < 80;

              return (
                <div
                  key={tm.topic}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3 transition hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{tm.topic}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {tm.questions_attempted} Questions Attempted • {tm.questions_correct} Correct
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${
                        isMastered
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : isInProgress
                          ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {tm.status}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Mastery Level</span>
                      <span className="font-mono font-semibold text-slate-200">
                        {tm.mastery_score}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isMastered
                            ? 'bg-emerald-500'
                            : isInProgress
                            ? 'bg-indigo-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${tm.mastery_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Recommended source reference */}
                  {tm.recommended_source && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                      <BookOpen className="h-3 w-3 text-indigo-400 shrink-0" />
                      <span className="truncate">Reference: {tm.recommended_source}</span>
                    </div>
                  )}

                  {/* Targeted practice trigger */}
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => onPracticeTopic(tm.topic)}
                      className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition"
                    >
                      <span>Take Practice Quiz on {tm.topic}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
