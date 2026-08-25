import os
import threading
from sentence_transformers import SentenceTransformer

# Google Drive folder ID for custom fine-tuned model weights
DRIVE_FOLDER_ID = "1z6wpFJKfHv_fFCriA4DUNzLW1shWoLKG"
DEFAULT_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

class ModelLoader:
    """
    Thread-safe Singleton class to load and serve the fine-tuned
    Sentence-Transformer model once on application startup.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(ModelLoader, cls).__new__(cls)
                    cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        default_local_dir = os.path.join(script_dir, "saved_model")
        
        model_path = os.environ.get("MODEL_PATH", "").strip()
        custom_folder = os.environ.get("CUSTOM_MODEL_DIR", default_local_dir).strip()

        print("🔄 [ModelLoader] Initializing Sentence-Transformer model...")

        # 1. Check local saved_model directory in ml-service (first priority)
        candidates = [
            custom_folder,
            default_local_dir,
            os.path.join(os.getcwd(), "saved_model"),
            os.path.join(os.getcwd(), "ml-service", "saved_model"),
            model_path
        ]

        for path_option in candidates:
            if path_option and os.path.isdir(path_option) and os.path.exists(os.path.join(path_option, "config.json")):
                print(f"📦 [ModelLoader] Loading fine-tuned weights from local directory: {path_option}")
                try:
                    self.model = SentenceTransformer(path_option)
                    self.model_source = path_option
                    print("✅ [ModelLoader] Custom fine-tuned model loaded from local saved_model successfully.")
                    return
                except Exception as e:
                    print(f"⚠️ [ModelLoader] Error loading from {path_option}: {e}")

        # 3. Attempt to download from Google Drive folder if gdown is available
        try:
            import gdown
            if not os.path.exists(custom_folder):
                os.makedirs(custom_folder, exist_ok=True)
            print(f"🌐 [ModelLoader] Attempting to sync fine-tuned model files from Google Drive (Folder ID: {DRIVE_FOLDER_ID})...")
            gdown.download_folder(id=DRIVE_FOLDER_ID, output=custom_folder, quiet=False, use_cookies=False)
            if os.path.exists(os.path.join(custom_folder, "config.json")):
                self.model = SentenceTransformer(custom_folder)
                self.model_source = custom_folder
                print("✅ [ModelLoader] Fine-tuned model downloaded from Drive and loaded successfully.")
                return
        except Exception as e:
            print(f"ℹ️ [ModelLoader] Drive sync bypassed or completed with note: {e}")

        # 4. Standard Base Model Fallback (all-MiniLM-L6-v2, 384-dimensional)
        print(f"🚀 [ModelLoader] Loading base architecture: {DEFAULT_MODEL_NAME}")
        self.model = SentenceTransformer(DEFAULT_MODEL_NAME)
        self.model_source = DEFAULT_MODEL_NAME
        print(f"✅ [ModelLoader] Model {DEFAULT_MODEL_NAME} initialized and ready (Embedding Dim: {self.get_dimension()}).")

    def encode(self, texts, **kwargs):
        """
        Computes normalized sentence/document embeddings.
        Returns numpy ndarray of shape (N, 384).
        """
        return self.model.encode(texts, normalize_embeddings=True, **kwargs)

    def get_dimension(self):
        """Returns the embedding dimension (384 for all-MiniLM-L6-v2)."""
        return self.model.get_sentence_embedding_dimension()


# Helper function to get model singleton instance
def get_model():
    return ModelLoader()
