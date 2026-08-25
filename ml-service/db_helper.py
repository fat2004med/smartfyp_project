import os
import threading
import numpy as np
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

class DatabaseHelper:
    """
    Manages MongoDB persistence and in-memory caching of 384-dimensional
    document embeddings for rapid sub-millisecond similarity queries.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(DatabaseHelper, cls).__new__(cls)
                    cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.mongo_uri = os.environ.get("MONGODB_URI") or os.environ.get("MONGO_URI", "mongodb://localhost:27017/smartfyp")
        self.db_name = os.environ.get("DB_NAME", "smartfyp")
        
        print(f"🔄 [DBHelper] Connecting to MongoDB (DB: {self.db_name})...")
        try:
            self.client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
            self.db = self.client[self.db_name]
            self.collection = self.db["plagiarismsources"]
            print("✅ [DBHelper] MongoDB connected.")
        except Exception as e:
            print(f"⚠️ [DBHelper] MongoDB initial connection error: {e}")
            self.client = None
            self.db = None
            self.collection = None

        # In-memory cached source embeddings and metadata
        self.cached_ids = []
        self.cached_titles = []
        self.cached_contents = []
        self.cached_embeddings = np.empty((0, 384), dtype=np.float32)

        # Preload embeddings into RAM
        self.reload_cache()

    def reload_cache(self):
        """Loads all stored document embeddings from MongoDB into NumPy matrix."""
        with self._lock:
            self.cached_ids = []
            self.cached_titles = []
            self.cached_contents = []
            embeddings_list = []

            if self.collection is not None:
                try:
                    cursor = self.collection.find({}, {"_id": 1, "title": 1, "content": 1, "embedding": 1})
                    for doc in cursor:
                        emb = doc.get("embedding")
                        if emb and isinstance(emb, list) and len(emb) == 384:
                            self.cached_ids.append(str(doc["_id"]))
                            self.cached_titles.append(doc.get("title", "Untitled Source Document"))
                            self.cached_contents.append(doc.get("content", ""))
                            embeddings_list.append(emb)

                    print(f"⚡ [DBHelper] Loaded {len(self.cached_titles)} source document embeddings into memory.")
                except Exception as e:
                    print(f"⚠️ [DBHelper] Failed to load embeddings from DB: {e}")

            if len(embeddings_list) > 0:
                self.cached_embeddings = np.array(embeddings_list, dtype=np.float32)
                # Normalize matrix rows for cosine similarity
                norms = np.linalg.norm(self.cached_embeddings, axis=1, keepdims=True)
                norms[norms == 0] = 1.0
                self.cached_embeddings = self.cached_embeddings / norms
            else:
                self.cached_embeddings = np.empty((0, 384), dtype=np.float32)

    def add_source(self, title: str, content: str, embedding: list, extra_meta: dict = None) -> dict:
        """Stores a new source document with its 384-d vector and updates the in-memory cache."""
        with self._lock:
            doc = {
                "title": title.strip(),
                "content": content.strip(),
                "embedding": embedding,
                "dimension": len(embedding),
                **(extra_meta or {})
            }

            inserted_id = None
            if self.collection is not None:
                res = self.collection.insert_one(doc)
                inserted_id = str(res.inserted_id)
                doc["_id"] = inserted_id

            # Update cache in-place
            self.cached_ids.append(inserted_id or f"local_{len(self.cached_titles)}")
            self.cached_titles.append(title.strip())
            self.cached_contents.append(content.strip())

            new_vec = np.array([embedding], dtype=np.float32)
            norm = np.linalg.norm(new_vec)
            if norm > 0:
                new_vec = new_vec / norm

            if self.cached_embeddings.size == 0:
                self.cached_embeddings = new_vec
            else:
                self.cached_embeddings = np.vstack([self.cached_embeddings, new_vec])

            return {
                "id": inserted_id,
                "title": title,
                "total_sources": len(self.cached_titles)
            }

    def get_sources_list(self) -> list:
        """Returns metadata list of all stored source documents."""
        sources = []
        for i, title in enumerate(self.cached_titles):
            sources.append({
                "id": self.cached_ids[i] if i < len(self.cached_ids) else str(i),
                "title": title,
                "content_preview": self.cached_contents[i][:150] + "..." if i < len(self.cached_contents) else ""
            })
        return sources

    def get_cached_embeddings(self):
        """Returns tuple of (titles, embeddings_matrix, ids, contents)."""
        return self.cached_titles, self.cached_embeddings, self.cached_ids, self.cached_contents


def get_db_helper():
    return DatabaseHelper()
