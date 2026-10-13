import re
from typing import List, Tuple, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.models.schemas import DocumentChunk
from app.config import settings

class RetrievalEngine:
    def __init__(self):
        self.chunks: List[DocumentChunk] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None

    def index_chunks(self, chunks: List[DocumentChunk]):
        """
        Builds or rebuilds the TF-IDF search index over all document chunks.
        """
        self.chunks = chunks
        if not self.chunks:
            self.vectorizer = None
            self.tfidf_matrix = None
            return

        corpus = [c.text for c in self.chunks]
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            stop_words="english",
            max_features=15000,
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)

    def search(
        self,
        query: str,
        top_k: int = settings.TOP_K_RETRIEVAL,
        material_ids: Optional[List[str]] = None,
        min_threshold: float = settings.SIMILARITY_THRESHOLD,
    ) -> List[Tuple[DocumentChunk, float]]:
        """
        Retrieves the most relevant chunks for a user question.
        Returns list of (DocumentChunk, score) tuples.
        """
        if not self.chunks or self.vectorizer is None or self.tfidf_matrix is None:
            return []

        # Vectorize query
        clean_query = query.strip()
        if not clean_query:
            return []

        query_vec = self.vectorizer.transform([clean_query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix)[0]

        # Apply keyword presence bonus for terms in query
        query_words = set(re.findall(r"\w+", clean_query.lower()))
        query_words = {w for w in query_words if len(w) > 3}

        scored_results: List[Tuple[DocumentChunk, float]] = []

        for idx, chunk in enumerate(self.chunks):
            # Optional material filter
            if material_ids and chunk.material_id not in material_ids:
                continue

            base_sim = float(similarities[idx])

            # Term overlap bonus
            chunk_lower = chunk.text.lower()
            overlap_count = sum(1 for w in query_words if w in chunk_lower)
            bonus = min(0.15, overlap_count * 0.03)

            final_score = base_sim + bonus

            if final_score >= min_threshold:
                scored_results.append((chunk, final_score))

        # Sort descending by final score
        scored_results.sort(key=lambda x: x[1], reverse=True)
        return scored_results[:top_k]

    def get_all_chunks(self) -> List[DocumentChunk]:
        return self.chunks

    def get_chunks_for_material(self, material_id: str) -> List[DocumentChunk]:
        return [c for c in self.chunks if c.material_id == material_id]

retrieval_engine = RetrievalEngine()
