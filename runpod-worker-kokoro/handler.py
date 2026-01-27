"""RunPod serverless handler for Kokoro-82M TTS."""

import base64
import io
import logging

import numpy as np
import runpod
import soundfile as sf
from kokoro import KPipeline
from pydub import AudioSegment

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load pipeline once at startup (model downloads on first run)
logger.info("Loading Kokoro pipeline...")
pipeline = KPipeline(lang_code="a")  # 'a' = American English
logger.info("Kokoro pipeline loaded.")

VALID_VOICES = {"am_adam", "af_sarah", "am_michael", "af_bella"}
SAMPLE_RATE = 24000


def handler(job: dict) -> dict:
    """Generate TTS audio from text using Kokoro-82M.

    Input (job["input"]):
        text: str - Text to synthesize
        voice_id: str - Kokoro voice ID (e.g. "am_adam")
        output_format: str - Output format ("mp3")
        mp3_bitrate: int - MP3 bitrate in kbps (e.g. 64)

    Returns:
        {"audio_base64": "<base64 encoded MP3>"}
    """
    job_input = job["input"]

    text = job_input.get("text", "")
    voice_id = job_input.get("voice_id", "am_adam")
    output_format = job_input.get("output_format", "mp3")
    mp3_bitrate = job_input.get("mp3_bitrate", 64)

    if not text:
        return {"error": "No text provided"}

    if voice_id not in VALID_VOICES:
        return {"error": f"Invalid voice_id '{voice_id}'. Valid: {VALID_VOICES}"}

    if output_format != "mp3":
        return {"error": f"Unsupported output_format '{output_format}'. Only 'mp3' is supported."}

    logger.info("Generating TTS: voice=%s, bitrate=%d, text_len=%d", voice_id, mp3_bitrate, len(text))

    # Generate audio chunks from Kokoro pipeline
    audio_chunks = []
    for result in pipeline(text, voice=voice_id):
        if result.audio is not None:
            audio_chunks.append(result.audio.numpy() if hasattr(result.audio, "numpy") else np.array(result.audio))

    if not audio_chunks:
        return {"error": "No audio generated"}

    # Concatenate all chunks into a single array
    audio = np.concatenate(audio_chunks)

    # Write WAV to memory buffer
    wav_buffer = io.BytesIO()
    sf.write(wav_buffer, audio, SAMPLE_RATE, format="WAV")
    wav_buffer.seek(0)

    # Convert WAV to MP3 using pydub (requires ffmpeg)
    audio_segment = AudioSegment.from_wav(wav_buffer)
    mp3_buffer = io.BytesIO()
    audio_segment.export(mp3_buffer, format="mp3", bitrate=f"{mp3_bitrate}k")
    mp3_buffer.seek(0)

    audio_base64 = base64.b64encode(mp3_buffer.read()).decode("utf-8")

    logger.info("Generated MP3: %d bytes", len(audio_base64) * 3 // 4)

    return {"audio_base64": audio_base64}


runpod.serverless.start({"handler": handler})
