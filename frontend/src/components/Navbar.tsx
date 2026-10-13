import React from 'react';
import {
  Sparkles,
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  HelpCircle,
  GraduationCap,
  Key,
  Database,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { HealthResponse } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: HealthResponse | null;
  onOpenApiKeyModal: () => void;
  onSeedSamples: () => void;
  isSeeding: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  health,
  onOpenApiKeyModal,
  onSeedSamples,
  isSeeding,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'library', label: 'Study Library', icon: BookOpen },
    { id: 'tutor', label: 'AI Tutor', icon: MessageSquare },
    { id: 'quiz', label: 'Quizzes', icon: HelpCircle },
    { id: 'mastery', label: 'Adaptive Mastery', icon: GraduationCap },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Track */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">LearnLens AI</span>
              <span className="hidden rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400 border border-indigo-500/20 sm:inline-block">
                Track D: Adaptive Tutoring
              </span>
            </div>
            <p className="text-xs text-slate-400">Multimodal AI Hackathon 2026</p>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-xl bg-slate-900/80 p-1 border border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Status Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick Seed Button if low chunks */}
          <button
            onClick={onSeedSamples}
            disabled={isSeeding}
            title="Load sample multimodal materials (PDF, PPTX, SRT, Notes)"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-600 hover:bg-slate-800 transition disabled:opacity-50"
          >
            <Database className="h-3.5 w-3.5 text-indigo-400" />
            <span>{isSeeding ? 'Seeding...' : 'Load Demo Materials'}</span>
          </button>

          {/* Gemini API Key Status Pill */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition ${
              health?.gemini_configured
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            {health?.gemini_configured ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Gemini Connected</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">Setup Gemini Key</span>
              </>
            )}
            <Key className="h-3 w-3 ml-0.5 opacity-70" />
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="flex md:hidden border-t border-slate-800 bg-slate-950 px-2 py-1.5 justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-medium transition ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
