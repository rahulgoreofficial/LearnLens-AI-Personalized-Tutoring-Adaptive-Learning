import React, { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  Layers,
  AlertCircle,
  Loader2,
  Filter,
} from 'lucide-react';
import { MaterialMetadata, Quiz, QuizSubmitResponse } from '../types';
import { generateQuiz, submitQuiz } from '../api/client';

interface QuizViewProps {
  materials: MaterialMetadata[];
  onQuizCompleted: () => void;
  preselectedTopic?: string | null;
  onNavigateToMastery: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  materials,
  onQuizCompleted,
  preselectedTopic,
  onNavigateToMastery,
}) => {
  // Configuration state
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('all');
  const [targetTopic, setTargetTopic] = useState<string>(preselectedTopic || '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numQuestions, setNumQuestions] = useState<number>(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [currentSelectedOption, setCurrentSelectedOption] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  // Results state
  const [quizResults, setQuizResults] = useState<QuizSubmitResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartQuiz = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const materialIds = selectedMaterialId !== 'all' ? [selectedMaterialId] : undefined;
      const quiz = await generateQuiz({
        materialIds,
        topic: targetTopic.trim() || undefined,
        difficulty,
        numQuestions,
      });

      setActiveQuiz(quiz);
      setCurrentQuestionIndex(0);
      setSelectedAnswers([]);
      setCurrentSelectedOption(null);
      setAnswerSubmitted(false);
      setQuizResults(null);
    } catch (err: any) {
      setGenError(err.message || 'Failed to generate dynamic quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmAnswer = () => {
    if (currentSelectedOption === null) return;
    setAnswerSubmitted(true);
  };

  const handleNextQuestion = async () => {
    if (!activeQuiz) return;
    const newAnswers = [...selectedAnswers, currentSelectedOption ?? -1];
    setSelectedAnswers(newAnswers);

    if (currentQuestionIndex + 1 < activeQuiz.questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentSelectedOption(null);
      setAnswerSubmitted(false);
    } else {
      // Quiz complete, submit answers to backend
      setIsSubmitting(true);
      try {
        const response = await submitQuiz(activeQuiz.quiz_id, newAnswers);
        setQuizResults(response);
        onQuizCompleted();
      } catch (err: any) {
        alert(`Error recording quiz submission: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleResetQuiz = () => {
    setActiveQuiz(null);
    setQuizResults(null);
    setCurrentSelectedOption(null);
    setAnswerSubmitted(false);
    setSelectedAnswers([]);
  };

  // 1. Results View
  if (quizResults && activeQuiz) {
    const isPassing = quizResults.score_percentage >= 70;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 text-center shadow-xl">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border ${
              isPassing
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
            }`}
          >
            <Award className="h-8 w-8" />
          </div>

          <h2 className="mt-4 text-2xl font-bold text-white">Quiz Completed!</h2>
          <p className="mt-1 text-xs text-slate-400">
            {isPassing ? 'Outstanding! You demonstrated strong mastery.' : 'Good effort! Review the weak topics below to master this concept.'}
          </p>

          <div className="mt-6 flex items-center justify-center gap-8">
            <div className="text-center">
              <span className="text-3xl font-extrabold text-white">
                {quizResults.correct_count}/{quizResults.total_questions}
              </span>
              <p className="text-xs text-slate-400 mt-0.5">Correct Answers</p>
            </div>
            <div className="h-10 w-px bg-slate-800" />
            <div className="text-center">
              <span
                className={`text-3xl font-extrabold ${
                  isPassing ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {quizResults.score_percentage}%
              </span>
              <p className="text-xs text-slate-400 mt-0.5">Score Accuracy</p>
            </div>
          </div>

          {/* Updated Topic Mastery breakdown */}
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Topic Mastery Updates
            </h4>
            <div className="space-y-2">
              {Object.entries(quizResults.mastery_updates).map(([topic, newScore]) => (
                <div key={topic} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{topic}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          newScore >= 80 ? 'bg-emerald-500' : newScore >= 50 ? 'bg-indigo-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${newScore}%` }}
                      />
                    </div>
                    <span className="font-mono text-slate-300 w-10 text-right">{newScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleResetQuiz}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Generate Another Quiz</span>
            </button>
            <button
              onClick={onNavigateToMastery}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-medium text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition"
            >
              <span>View Full Mastery Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Answer Breakdown & Explanations</h3>
          {quizResults.question_results.map((res, idx) => (
            <div
              key={res.question_id || idx}
              className={`rounded-xl border p-4 text-xs ${
                res.is_correct
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-rose-500/20 bg-rose-500/5'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-slate-200">
                  {idx + 1}. {res.question}
                </span>
                {res.is_correct ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-rose-400 shrink-0">
                    <XCircle className="h-3.5 w-3.5" /> Incorrect
                  </span>
                )}
              </div>
              <p className="mt-2 text-slate-300 leading-relaxed">{res.explanation}</p>
              <div className="mt-2 text-[11px] font-medium text-indigo-400 flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span>Source: {res.source_reference}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Active Quiz Player
  if (activeQuiz) {
    const currentQ = activeQuiz.questions[currentQuestionIndex];
    const isAnswerChecked = answerSubmitted;
    const isCorrect = currentSelectedOption === currentQ.correct_answer_index;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress & Header */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">
              Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
            </span>
            <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/20 uppercase">
              {currentQ.difficulty}
            </span>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
              {currentQ.topic}
            </span>
          </div>
          <button
            onClick={handleResetQuiz}
            className="text-slate-400 hover:text-slate-200 transition"
          >
            Exit Quiz
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%`,
            }}
          />
        </div>

        {/* Question Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-6">
          <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
            {currentQ.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, optIdx) => {
              const isSelected = currentSelectedOption === optIdx;
              let optionStyles = 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900';

              if (isAnswerChecked) {
                if (optIdx === currentQ.correct_answer_index) {
                  optionStyles = 'border-emerald-500 bg-emerald-500/10 text-emerald-200 font-semibold';
                } else if (isSelected && !isCorrect) {
                  optionStyles = 'border-rose-500 bg-rose-500/10 text-rose-200 font-semibold';
                } else {
                  optionStyles = 'border-slate-800/60 bg-slate-950/30 text-slate-500';
                }
              } else if (isSelected) {
                optionStyles = 'border-indigo-500 bg-indigo-500/10 text-white font-medium shadow-sm';
              }

              const letters = ['A', 'B', 'C', 'D'];

              return (
                <div
                  key={optIdx}
                  onClick={() => !isAnswerChecked && setCurrentSelectedOption(optIdx)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-xs sm:text-sm cursor-pointer transition select-none ${optionStyles}`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-800/80 text-xs font-bold text-slate-300 border border-slate-700">
                    {letters[optIdx]}
                  </span>
                  <span className="leading-relaxed">{option}</span>
                </div>
              );
            })}
          </div>

          {/* Explanation reveal */}
          {isAnswerChecked && (
            <div
              className={`rounded-xl border p-4 text-xs space-y-2 ${
                isCorrect
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Correct Answer!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-rose-400" />
                    <span>Incorrect — Keep Learning!</span>
                  </>
                )}
              </div>
              <p className="leading-relaxed text-slate-300">{currentQ.explanation}</p>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 pt-1">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Verified Source: {currentQ.source_reference}</span>
              </div>
            </div>
          )}

          {/* Bottom Action */}
          <div className="flex justify-end pt-2">
            {!isAnswerChecked ? (
              <button
                onClick={handleConfirmAnswer}
                disabled={currentSelectedOption === null}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Check Answer</span>
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50"
              >
                <span>
                  {currentQuestionIndex + 1 < activeQuiz.questions.length
                    ? 'Next Question'
                    : isSubmitting
                    ? 'Grading Quiz...'
                    : 'Finish Quiz'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Quiz Configuration View
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          Personalized Quiz Generator
          <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400 border border-indigo-500/20">
            Source Grounded
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Dynamically generate targeted assessments grounded in your uploaded textbooks, lecture slides, and transcripts.
        </p>
      </div>

      {genError && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{genError}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-5">
        {/* Material Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-indigo-400" />
            Study Material Scope
          </label>
          <select
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Library Materials ({materials.length})</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.doc_type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Topic Input */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Target Concept or Topic (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Backpropagation, Self-Attention, Adam Optimizer, ReLU"
            value={targetTopic}
            onChange={(e) => setTargetTopic(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Leave blank to assess general topics across the chosen study materials.
          </p>
        </div>

        {/* Difficulty Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Difficulty Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['easy', 'medium', 'hard'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setDifficulty(lvl)}
                className={`rounded-xl border p-3 text-xs font-semibold capitalize transition ${
                  difficulty === lvl
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Number of Questions
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[3, 5, 8].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNumQuestions(n)}
                className={`rounded-xl border p-3 text-xs font-semibold transition ${
                  numQuestions === n
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                {n} Questions
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            onClick={handleStartQuiz}
            disabled={isGenerating || materials.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Synthesizing Grounded Quiz Questions...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Adaptive Quiz</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
