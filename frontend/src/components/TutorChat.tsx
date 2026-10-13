import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  BookOpen,
  Filter,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { MaterialMetadata, Citation } from '../types';
import { askTutor } from '../api/client';
import { CitationCard } from './CitationCard';

interface TutorChatProps {
  materials: MaterialMetadata[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  citations?: Citation[];
  sufficientEvidence?: boolean;
  retrievedCount?: number;
  usedModel?: string;
  timestamp: string;
}

export const TutorChat: React.FC<TutorChatProps> = ({ materials }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'tutor',
      text: "Hello! I am your **LearnLens AI Tutor**. Ask me anything about your uploaded textbooks, lecture slides, or video transcripts. Every response I provide is strictly grounded in your materials with verifiable page, slide, and timestamp citations.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleQuestions = [
    'What is the formula for scaled dot-product attention and why is the scaling factor used?',
    'How does ReLU activation mitigate the vanishing gradient problem compared to Sigmoid?',
    'How does the Adam optimizer calculate its adaptive moments compared to standard SGD?',
    'Why does Dropout prevent overfitting during neural network training?',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputQuery).trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const materialFilter = selectedMaterialId !== 'all' ? [selectedMaterialId] : null;
      const res = await askTutor(q, materialFilter);

      const tutorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'tutor',
        text: res.answer,
        citations: res.citations,
        sufficientEvidence: res.sufficient_evidence,
        retrievedCount: res.retrieved_chunks_count,
        usedModel: res.used_model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, tutorMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'tutor',
        text: `⚠️ Error querying tutor: ${err.message || 'Unable to complete request.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
      {/* Header & Material Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Source-Grounded AI Tutor
              <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" /> Grounded Retrieval
              </span>
            </h3>
            <p className="text-xs text-slate-400">Strictly cites verified pages, slides, and timestamps</p>
          </div>
        </div>

        {/* Material selector */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Search All Study Materials ({materials.length})</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.doc_type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950/40">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-xs ${
                  isUser
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-800 border-slate-700 text-indigo-400'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Bubble Container */}
              <div className={`flex flex-col space-y-2 max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`relative rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {!isUser && msg.id !== 'welcome' && (
                    <button
                      onClick={() => copyToClipboard(msg.text, msg.id)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-slate-200 transition"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Grounding Status Alert if Insufficient Evidence */}
                {!isUser && msg.sufficientEvidence === false && (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-300">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>Guardrail active: Insufficient context found in library to answer confidently.</span>
                  </div>
                )}

                {/* Citations Section */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="w-full space-y-2 mt-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                        Verified Source Citations ({msg.citations.length})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {msg.usedModel ? `Synthesized via ${msg.usedModel}` : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {msg.citations.map((c, idx) => (
                        <CitationCard key={c.citation_id || idx} citation={c} index={idx + 1} />
                      ))}
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-slate-500 px-1">{msg.timestamp}</span>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-indigo-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-slate-800 bg-slate-900 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-indigo-300">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                <span>Searching knowledge base and verifying citations...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Inquiries */}
      <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/70 overflow-x-auto flex items-center gap-2">
        <span className="text-[11px] text-slate-400 shrink-0 font-medium">Quick Inquiries:</span>
        {sampleQuestions.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sq)}
            disabled={isLoading}
            className="shrink-0 rounded-full border border-slate-700/80 bg-slate-900 px-3 py-1 text-[11px] text-slate-300 hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask a question about your uploaded materials (e.g., 'What is scaled dot product attention?')..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
