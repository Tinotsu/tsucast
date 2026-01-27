FROM python:3.11-slim

# System deps: espeak-ng (phonemizer for Kokoro), ffmpeg (MP3 encoding)
RUN apt-get update && \
    apt-get install -y --no-install-recommends espeak-ng ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY handler.py .

# Pre-download model weights so cold starts are fast
RUN python -c "from kokoro import KPipeline; KPipeline(lang_code='a')"

CMD ["python", "-u", "handler.py"]
