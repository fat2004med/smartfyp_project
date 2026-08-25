# Python 3.10 Slim base image
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (build tools and git for sentence-transformers/pdf/docx)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY ml-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy microservice source code
COPY ml-service/ .

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHON_PORT=5000
ENV PLAGIARISM_THRESHOLD=0.40
ENV MODEL_PATH=/app/saved_model
ENV CUSTOM_MODEL_DIR=/app/saved_model

# Expose port
EXPOSE 5000

# Start Flask WSGI server with Gunicorn or direct execution
CMD ["python", "app.py"]
