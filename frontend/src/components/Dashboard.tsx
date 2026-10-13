import React from 'react';
import {
  BookOpen,
  Layers,
  MessageSquare,
  HelpCircle,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Award,
  ChevronRight,
} from 'lucide-react';
import { MaterialMetadata, AdaptiveProgressResponse } from '../types';

interface DashboardProps {
  materials: MaterialMetadata[];
  progress: AdaptiveProgressResponse | null;
  onNavigate: (tab: string, topic?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  materials,
  progress,
  onNavigate,
}) => {
  const totalChunks = progress?.total_chunks || materials.reduce((acc, m) => acc + m.chunk_count, 0);
  const totalQuestions = progress?.total_questions_asked || 0;
  const overallAcc = progress?.overall_accuracy || 0;
  const avgMastery = progress?.average_mastery || 0;

  const weakTopics = progress?.weak_topics || [];
  const recommendedActions = progress?.recommended_actions || [];
  const recentQna = progress?.recent_qna || [];
  const quizHistory = progress?.quiz_history || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="h-4 w-4" />
            <span>AI Study Companion & Adaptive Assessment Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome to LearnLens AI
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Your lecture videos, slides, textbooks, and notes are unified into a source-cited knowledge base.
            Ask questions with verifiable citations, test your recall with adaptive quizzes, and master weak topics.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('tutor')}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Ask Source-Grounded Tutor</span>
            </button>
            <button
              onClick={() => onNavigate('quiz')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              <HelpCircle className="h-4 w-4 text-indigo-400" />
              <span>Start Adaptive Quiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Study Materials</span>
            <BookOpen className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{materials.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">PDFs, PPTXs, Transcripts</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Indexed Chunks</span>
            <Layers className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{totalChunks}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">With Page & Slide Provenance</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Tutor Inquiries</span>
            <MessageSquare className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{totalQuestions}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Source-grounded Q&A</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Quiz Accuracy</span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{overallAcc}%</div>
          <p className="text-[11px] text-slate-500 mt-0.5">{quizHistory.length} Quizzes Completed</p>
        </div>

        <div className="col-span-2 lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Topic Mastery</span>
            <GraduationCap className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{avgMastery}%</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Across Monitored Topics</p>
        </div>
      </div>

      {/* Weak Topics Alert */}
      {weakTopics.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Topics Requiring More Practice</h3>
              <p className="text-xs text-amber-200/90 mt-0.5">
                Low mastery detected in: <span className="font-semibold text-white">{weakTopics.join(', ')}</span>.
                Review the source notes or take a targeted practice quiz.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('quiz', weakTopics[0])}
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow hover:bg-amber-400 transition"
          >
            <span>Practice {weakTopics[0]}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Recommended Actions & Recent Q&A */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Next Study Actions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
              Recommended Study Actions
            </h3>
            <span className="text-[11px] text-slate-500">Adaptive Queue</span>
          </div>

          <div className="space-y-3">
            {recommendedActions.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Upload study materials and take a quiz to generate personalized recommendations.
              </p>
            ) : (
              recommendedActions.slice(0, 4).map((action, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 transition hover:border-slate-700 flex items-start justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{action.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{action.reason}</p>
                    {action.locator && (
                      <span className="inline-block mt-2 rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/20">
                        {action.material_title} • {action.locator}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (action.action_type === 'practice_topic' && action.topic) {
                        onNavigate('quiz', action.topic);
                      } else if (action.action_type === 'review_material') {
                        onNavigate('library');
                      } else {
                        onNavigate('quiz');
                      }
                    }}
                    className="shrink-0 flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-indigo-600 hover:text-white transition"
                  >
                    <span>Go</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Q&A History */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-cyan-400" />
              Recent Tutor Inquiries
            </h3>
            <button
              onClick={() => onNavigate('tutor')}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 transition"
            >
              Open Tutor Chat →
            </button>
          </div>

          <div className="space-y-3">
            {recentQna.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No questions asked yet. Head over to the AI Tutor to ask your first question!
              </p>
            ) : (
              recentQna.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-indigo-300">Q: {item.question}</span>
                    <span className="text-slate-500">{item.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {item.answer}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                      {item.citation_count} Grounded Citations
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quiz History Table */}
      {quizHistory.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-indigo-400" />
              Recent Quiz History
            </h3>
            <span className="text-xs text-slate-400">{quizHistory.length} Total Sessions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 bg-slate-950/40">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Difficulty</th>
                  <th className="py-2.5 px-3">Questions</th>
                  <th className="py-2.5 px-3">Correct</th>
                  <th className="py-2.5 px-3">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {quizHistory.slice(0, 5).map((q) => (
                  <tr key={q.quiz_id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                      {q.timestamp}
                    </td>
                    <td className="py-2.5 px-3 uppercase text-[10px] font-semibold text-indigo-300">
                      {q.difficulty}
                    </td>
                    <td className="py-2.5 px-3">{q.total_questions}</td>
                    <td className="py-2.5 px-3">{q.correct_count}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                          q.score_percentage >= 70
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {q.score_percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
