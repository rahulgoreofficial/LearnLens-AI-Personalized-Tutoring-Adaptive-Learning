import {
  HealthResponse,
  MaterialMetadata,
  DocumentChunk,
  TutorAskResponse,
  Quiz,
  QuizSubmitResponse,
  AdaptiveProgressResponse,
} from '../types';

const BASE_URL = '/api';

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Failed to reach backend service');
  return res.json();
}

export async function configureApiKey(apiKey: string): Promise<{ status: string; gemini_configured: boolean; model_name: string }> {
  const res = await fetch(`${BASE_URL}/config/api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to configure API key' }));
    throw new Error(err.detail || 'Failed to configure API key');
  }
  return res.json();
}

export async function fetchMaterials(): Promise<MaterialMetadata[]> {
  const res = await fetch(`${BASE_URL}/materials`);
  if (!res.ok) throw new Error('Failed to fetch materials');
  return res.json();
}

export async function fetchMaterialDetail(materialId: string): Promise<{
  metadata: MaterialMetadata;
  chunks: DocumentChunk[];
  total_chunks: number;
}> {
  const res = await fetch(`${BASE_URL}/materials/${materialId}`);
  if (!res.ok) throw new Error('Failed to load document details');
  return res.json();
}

export async function uploadMaterial(file: File): Promise<MaterialMetadata> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/materials/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(errorData.detail || 'File upload and parsing failed');
  }

  return res.json();
}

export async function importYouTube(url: string, title?: string): Promise<MaterialMetadata> {
  const res = await fetch(`${BASE_URL}/materials/youtube`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, title }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'YouTube import failed' }));
    throw new Error(errorData.detail || 'Failed to import YouTube lecture');
  }

  return res.json();
}

export async function deleteMaterial(materialId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/materials/${materialId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete material');
}

export async function seedSampleMaterials(): Promise<{ status: string; materials: MaterialMetadata[] }> {
  const res = await fetch(`${BASE_URL}/materials/seed-samples`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to seed sample materials');
  return res.json();
}

export async function askTutor(
  question: string,
  materialIds?: string[] | null
): Promise<TutorAskResponse> {
  const res = await fetch(`${BASE_URL}/tutor/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      material_ids: materialIds && materialIds.length > 0 ? materialIds : null,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Tutor query failed' }));
    throw new Error(errorData.detail || 'Tutor query failed');
  }

  return res.json();
}

export async function generateQuiz(options: {
  materialIds?: string[];
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  numQuestions: number;
}): Promise<Quiz> {
  const res = await fetch(`${BASE_URL}/quiz/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      material_ids: options.materialIds && options.materialIds.length > 0 ? options.materialIds : null,
      topic: options.topic || null,
      difficulty: options.difficulty,
      num_questions: options.numQuestions,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Quiz generation failed' }));
    throw new Error(errorData.detail || 'Quiz generation failed');
  }

  return res.json();
}

export async function submitQuiz(quizId: string, answers: number[]): Promise<QuizSubmitResponse> {
  const res = await fetch(`${BASE_URL}/quiz/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quiz_id: quizId,
      answers,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Submission failed' }));
    throw new Error(errorData.detail || 'Quiz submission failed');
  }

  return res.json();
}

export async function fetchProgress(): Promise<AdaptiveProgressResponse> {
  const res = await fetch(`${BASE_URL}/progress`);
  if (!res.ok) throw new Error('Failed to fetch progress telemetry');
  return res.json();
}

export async function resetProgress(): Promise<void> {
  const res = await fetch(`${BASE_URL}/progress/reset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset progress');
}
