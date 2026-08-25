import os
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from model_loader import get_model
from db_helper import get_db_helper
from text_extractor import extract_text_from_file

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize singletons on startup
print("🚀 [Plagiarism Microservice] Booting Flask ML Engine...")
model_service = get_model()
db_helper = get_db_helper()

DEFAULT_THRESHOLD = float(os.environ.get("PLAGIARISM_THRESHOLD", "0.40"))

@app.route("/health", methods=["GET"])
def health():
    titles, embeddings, _, _ = db_helper.get_cached_embeddings()
    return jsonify({
        "status": "healthy",
        "service": "Plagiarism Detection ML Microservice",
        "model": model_service.model_source,
        "embedding_dimension": model_service.get_dimension(),
        "total_indexed_sources": len(titles),
        "default_threshold": DEFAULT_THRESHOLD
    })

@app.route("/sources", methods=["GET"])
def list_sources():
    """
    GET /sources – Lists all stored source documents (titles and IDs).
    """
    try:
        sources = db_helper.get_sources_list()
        return jsonify({
            "success": True,
            "count": len(sources),
            "sources": sources
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/add-source", methods=["POST"])
def add_source():
    """
    POST /add-source – Adds a new source document to the MongoDB database.
    Accepts JSON: { "title": "...", "content": "..." }
    """
    try:
        data = request.get_json(force=True)
        title = data.get("title", "").strip()
        content = data.get("content", "").strip()

        if not title or not content:
            return jsonify({
                "success": False,
                "error": "Both 'title' and 'content' are required fields."
            }), 400

        # Compute 384-d vector embedding
        embedding = model_service.encode([content])[0].tolist()

        # Store in MongoDB and update cache
        result = db_helper.add_source(title, content, embedding)

        return jsonify({
            "success": True,
            "message": f"Source document '{title}' indexed successfully.",
            "data": result
        }), 201
    except Exception as e:
        print(f"❌ [add-source] Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/upload", methods=["POST"])
def check_plagiarism_upload():
    """
    POST /upload – Main plagiarism detection endpoint.
    Accepts multipart/form-data:
      - file: PDF / DOCX / TXT documentation file
      - threshold (optional float, default 0.4)
    """
    try:
        if "file" not in request.files:
            return jsonify({
                "success": False,
                "error": "No 'file' part in the request."
            }), 400

        uploaded_file = request.files["file"]
        if uploaded_file.filename == "":
            return jsonify({
                "success": False,
                "error": "No file selected for upload."
            }), 400

        # Parse threshold
        raw_threshold = request.form.get("threshold") or request.args.get("threshold")
        try:
            threshold = float(raw_threshold) if raw_threshold is not None else DEFAULT_THRESHOLD
        except (ValueError, TypeError):
            threshold = DEFAULT_THRESHOLD

        # 1. Extract clean text from file
        filename = uploaded_file.filename
        content = extract_text_from_file(uploaded_file, filename)

        if not content or len(content.strip()) < 15:
            return jsonify({
                "success": False,
                "error": "Could not extract sufficient text from the uploaded document."
            }), 400

        # 2. Compute embedding using fine-tuned Sentence-Transformer model
        query_embedding = model_service.encode([content])[0]  # shape: (384,)
        query_norm = np.linalg.norm(query_embedding)
        if query_norm > 0:
            query_embedding = query_embedding / query_norm

        # 3. Compare against all stored embeddings using cosine similarity
        titles, source_embeddings, ids, contents = db_helper.get_cached_embeddings()

        if len(titles) == 0:
            # If no stored sources exist yet, return baseline zero match
            return jsonify({
                "overall_score": 0.0,
                "is_plagiarized": False,
                "threshold": threshold,
                "breakdown": [],
                "message": "No peer documents in database to compare against.",
                "total_sources_evaluated": 0
            })

        # Cosine similarity between query vector (384,) and source matrix (N, 384)
        similarities = np.dot(source_embeddings, query_embedding)  # shape: (N,)

        # Replace negative values with 0
        similarities = np.clip(similarities, 0.0, 1.0)

        # 4. Calculate Scores:
        # Maximum matching similarity against any single reference document
        max_sim = float(np.max(similarities)) if len(similarities) > 0 else 0.0
        overall_score = round(min(1.0, max(0.0, max_sim)), 4)

        # Build detailed source contributions
        breakdown = []
        for idx in range(len(titles)):
            sim = float(similarities[idx])
            if sim > 0.03:  # Only report sources with noticeable overlap
                # Contribution calculation (contribution score as a fraction of overall match)
                contribution = round(sim, 4)
                breakdown.append({
                    "id": ids[idx],
                    "title": titles[idx],
                    "contribution": contribution,
                    "similarity": round(sim, 4),
                    "snippet": contents[idx][:200] + "..." if idx < len(contents) else ""
                })

        # Sort breakdown by similarity descending
        breakdown.sort(key=lambda x: x["contribution"], reverse=True)

        is_plagiarized = bool(overall_score >= threshold)

        return jsonify({
            "overall_score": overall_score,
            "overall_percentage": round(overall_score * 100, 1),
            "is_plagiarized": is_plagiarized,
            "threshold": threshold,
            "threshold_percentage": round(threshold * 100, 1),
            "breakdown": breakdown,
            "total_sources_evaluated": len(titles),
            "filename": filename
        })

    except Exception as e:
        print(f"❌ [PlagiarismUpload] Error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/check-text", methods=["POST"])
def check_text():
    """
    POST /check-text – Evaluates raw text directly.
    """
    try:
        data = request.get_json(force=True)
        content = data.get("content", "").strip()
        threshold = float(data.get("threshold", DEFAULT_THRESHOLD))

        if not content:
            return jsonify({"success": False, "error": "Content is required"}), 400

        query_embedding = model_service.encode([content])[0]
        query_norm = np.linalg.norm(query_embedding)
        if query_norm > 0:
            query_embedding = query_embedding / query_norm

        titles, source_embeddings, ids, contents = db_helper.get_cached_embeddings()

        if len(titles) == 0:
            return jsonify({
                "overall_score": 0.0,
                "is_plagiarized": False,
                "threshold": threshold,
                "breakdown": []
            })

        similarities = np.clip(np.dot(source_embeddings, query_embedding), 0.0, 1.0)
        max_sim = float(np.max(similarities)) if len(similarities) > 0 else 0.0
        overall_score = round(min(1.0, max(0.0, max_sim)), 4)

        breakdown = []
        for idx in range(len(titles)):
            sim = float(similarities[idx])
            if sim > 0.03:
                breakdown.append({
                    "title": titles[idx],
                    "contribution": round(sim, 4),
                    "similarity": round(sim, 4)
                })

        breakdown.sort(key=lambda x: x["contribution"], reverse=True)

        return jsonify({
            "overall_score": overall_score,
            "is_plagiarized": bool(overall_score >= threshold),
            "threshold": threshold,
            "breakdown": breakdown
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PYTHON_PORT", "5000"))
    print(f"🌟 Plagiarism ML Microservice running on http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
