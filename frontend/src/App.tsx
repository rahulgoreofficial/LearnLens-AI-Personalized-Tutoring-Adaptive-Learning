import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { MaterialLibrary } from './components/MaterialLibrary';
import { TutorChat } from './components/TutorChat';
import { QuizView } from './components/QuizView';
import { AdaptiveMasteryView } from './components/AdaptiveMasteryView';
import { ApiKeyModal } from './components/ApiKeyModal';
import {
  fetchHealth,
  fetchMaterials,
  fetchProgress,
  seedSampleMaterials,
} from './api/client';
import { MaterialMetadata, AdaptiveProgressResponse, HealthResponse } from './types';
import { Loader2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [materials, setMaterials] = useState<MaterialMetadata[]>([]);
  const [progress, setProgress] = useState<AdaptiveProgressResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [preselectedTopic, setPreselectedTopic] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadData = async () => {
    try {
      const [hRes, mRes, pRes] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchMaterials().catch(() => []),
        fetchProgress().catch(() => null),
      ]);
      setHealth(hRes);
      setMaterials(mRes);
      setProgress(pRes);
    } catch (err) {
      console.error('Error fetching application state:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeedSamples = async () => {
    setIsSeeding(true);
    try {
      await seedSampleMaterials();
      await loadData();
    } catch (err: any) {
      alert(`Error loading sample study materials: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleNavigateWithTopic = (tab: string, topic?: string) => {
    if (topic) {
      setPreselectedTopic(topic);
    }
    setActiveTab(tab);
  };

  const handlePracticeTopicFromMastery = (topic: string) => {
    setPreselectedTopic(topic);
    setActiveTab('quiz');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setPreselectedTopic(null);
          setActiveTab(tab);
        }}
        health={health}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onSeedSamples={handleSeedSamples}
        isSeeding={isSeeding}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {initialLoading ? (
          <div className="flex h-96 flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-xs text-slate-400">Initializing LearnLens AI Knowledge Engine...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                materials={materials}
                progress={progress}
                onNavigate={handleNavigateWithTopic}
              />
            )}

            {activeTab === 'library' && (
              <MaterialLibrary
                materials={materials}
                onRefresh={loadData}
                onSeedSamples={handleSeedSamples}
                isSeeding={isSeeding}
              />
            )}

            {activeTab === 'tutor' && <TutorChat materials={materials} />}

            {activeTab === 'quiz' && (
              <QuizView
                materials={materials}
                onQuizCompleted={loadData}
                preselectedTopic={preselectedTopic}
                onNavigateToMastery={() => setActiveTab('mastery')}
              />
            )}

            {activeTab === 'mastery' && (
              <AdaptiveMasteryView
                progress={progress}
                onRefresh={loadData}
                onPracticeTopic={handlePracticeTopicFromMastery}
              />
            )}
          </>
        )}
      </main>

      {/* Gemini API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSuccess={loadData}
        isConfigured={health?.gemini_configured || false}
      />

      {/* Modern Educational Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-400">LearnLens AI</span> — Multimodal AI Hackathon 2026 (Track D: Personalized Tutoring & Adaptive Learning)
          </div>
          <div className="text-[11px] text-slate-600">
            AI-Assisted Development: Google Antigravity & Gemini • Verified Provenance Citations
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
