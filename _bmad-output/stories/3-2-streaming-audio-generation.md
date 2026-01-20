# Story 3.2: Streaming Audio Generation

Status: ready-for-dev

## Story

As a user who submitted content,
I want audio to start playing within 10 seconds,
so that I experience the magic instantly.

## Acceptance Criteria

1. **AC1: Generation Progress**
   - Given user taps "Generate"
   - When generation starts
   - Then they see a progress indicator
   - And content is sent to Fish Audio API
   - And audio streams directly to R2 storage

2. **AC2: Generation Complete**
   - Given generation completes
   - When audio file is ready in R2
   - Then `audio_cache` row is updated with status='ready'
   - And audio URL is returned to client
   - And auto-play begins

3. **AC3: Concurrent Generation Handling**
   - Given same URL was generating by another user
   - When current user requests it
   - Then they poll until status='ready'
   - And receive the cached audio

4. **AC4: Generation Failure**
   - Given Fish Audio API fails
   - When error occurs
   - Then `audio_cache` status is set to 'failed'
   - And user sees: "Audio generation failed. Try again?"

## Tasks / Subtasks

### Task 1: Audio Cache Database Table (AC: 2, 3, 4)
- [ ] 1.1 Create migration `supabase/migrations/003_audio_cache.sql`:
  ```sql
  CREATE TABLE audio_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_hash TEXT UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    voice_id TEXT NOT NULL,
    title TEXT,
    audio_url TEXT,
    duration_seconds INTEGER,
    word_count INTEGER,
    file_size_bytes INTEGER,
    status TEXT DEFAULT 'generating',  -- 'generating', 'ready', 'failed'
    error_message TEXT,
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  CREATE INDEX idx_audio_cache_url_hash ON audio_cache(url_hash);
  CREATE INDEX idx_audio_cache_status ON audio_cache(status);
  CREATE INDEX idx_audio_cache_created_by ON audio_cache(created_by);

  -- Trigger for updated_at
  CREATE TRIGGER audio_cache_updated_at
    BEFORE UPDATE ON audio_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  ```
- [ ] 1.2 Run migration

### Task 2: Fish Audio TTS Service (AC: 1, 4)
- [ ] 2.1 Create `apps/api/src/services/tts.ts`:
  ```typescript
  export interface TtsOptions {
    text: string;
    voiceId: string;
    signal?: AbortSignal;
  }

  export interface TtsResult {
    audioBuffer: Buffer;
    durationSeconds: number;
  }

  export async function generateSpeech(options: TtsOptions): Promise<TtsResult> {
    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FISH_AUDIO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: options.text,
        voice_id: options.voiceId,
        format: 'mp3',
        // Add any other Fish Audio parameters
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TTS_FAILED: ${response.status} - ${error}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Estimate duration (MP3 bitrate ~128kbps)
    const durationSeconds = Math.round(audioBuffer.length / (128 * 1024 / 8));

    return { audioBuffer, durationSeconds };
  }
  ```
- [ ] 2.2 Configure Fish Audio API key in environment
- [ ] 2.3 Add timeout handling (120s via abort signal)

### Task 3: R2 Storage Service (AC: 1, 2)
- [ ] 3.1 Install AWS S3 SDK (R2 compatible):
  ```bash
  npm install @aws-sdk/client-s3
  ```
- [ ] 3.2 Create `apps/api/src/services/storage.ts`:
  ```typescript
  import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
  import { randomUUID } from 'crypto';

  const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  export async function uploadAudio(
    audioBuffer: Buffer,
    contentType: string = 'audio/mpeg'
  ): Promise<{ key: string; url: string }> {
    const key = `audio/${randomUUID()}.mp3`;

    await r2Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: audioBuffer,
      ContentType: contentType,
    }));

    const url = `${process.env.R2_PUBLIC_URL}/${key}`;
    return { key, url };
  }
  ```
- [ ] 3.3 Configure R2 credentials in environment

### Task 4: Race Condition Prevention (AC: 3)
- [ ] 4.1 Update generate route with cache lock:
  ```typescript
  // Check cache and claim generation atomically
  const urlHash = await hashUrl(normalizeUrl(url));

  // Try to claim generation (INSERT with ON CONFLICT)
  const { data: claimed, error: claimError } = await supabase
    .from('audio_cache')
    .insert({
      url_hash: urlHash,
      original_url: url,
      voice_id: voiceId,
      status: 'generating',
      created_by: userId,
    })
    .select()
    .single();

  if (claimError?.code === '23505') {
    // URL already being generated - check status
    const { data: existing } = await supabase
      .from('audio_cache')
      .select()
      .eq('url_hash', urlHash)
      .single();

    if (existing?.status === 'ready') {
      return c.json({
        audioUrl: existing.audio_url,
        title: existing.title,
        duration: existing.duration_seconds,
      });
    }

    if (existing?.status === 'generating') {
      // Return polling response
      return c.json({
        status: 'generating',
        cacheId: existing.id,
        message: 'Audio is being generated. Please poll for status.',
      }, 202);
    }
  }
  ```

### Task 5: Complete Generate Flow (AC: 1, 2, 3, 4)
- [ ] 5.1 Update `apps/api/src/routes/generate.ts` with full flow:
  ```typescript
  generate.post('/generate', authMiddleware, async (c) => {
    const { url, voiceId } = await c.req.json();
    const user = c.get('user');
    const abortSignal = c.get('abortSignal');

    // 1. Normalize and hash URL
    const normalizedUrl = normalizeUrl(url);
    const urlHash = await hashUrl(normalizedUrl);

    // 2. Check cache / claim generation
    // ... (from Task 4)

    // 3. Parse content (from Story 2.2/2.3)
    const parsed = await parseContent(url);

    // 4. Generate TTS
    let ttsResult;
    try {
      ttsResult = await generateSpeech({
        text: parsed.textContent,
        voiceId,
        signal: abortSignal,
      });
    } catch (error) {
      // Mark as failed
      await supabase
        .from('audio_cache')
        .update({ status: 'failed', error_message: error.message })
        .eq('url_hash', urlHash);

      return c.json({
        error: { code: 'TTS_FAILED', message: 'Audio generation failed. Try again?' }
      }, 500);
    }

    // 5. Upload to R2
    const { url: audioUrl } = await uploadAudio(ttsResult.audioBuffer);

    // 6. Update cache entry
    await supabase
      .from('audio_cache')
      .update({
        status: 'ready',
        audio_url: audioUrl,
        title: parsed.title,
        word_count: parsed.wordCount,
        duration_seconds: ttsResult.durationSeconds,
        file_size_bytes: ttsResult.audioBuffer.length,
      })
      .eq('url_hash', urlHash);

    // 7. Add to user's library
    const { data: cacheEntry } = await supabase
      .from('audio_cache')
      .select('id')
      .eq('url_hash', urlHash)
      .single();

    await supabase
      .from('user_library')
      .insert({
        user_id: user.id,
        audio_id: cacheEntry.id,
      });

    return c.json({
      audioUrl,
      title: parsed.title,
      duration: ttsResult.durationSeconds,
      wordCount: parsed.wordCount,
    });
  });
  ```

### Task 6: Polling Endpoint (AC: 3)
- [ ] 6.1 Create status polling endpoint:
  ```typescript
  generate.get('/generate/status/:cacheId', async (c) => {
    const cacheId = c.req.param('cacheId');

    const { data: entry } = await supabase
      .from('audio_cache')
      .select('status, audio_url, title, duration_seconds, error_message')
      .eq('id', cacheId)
      .single();

    if (!entry) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, 404);
    }

    if (entry.status === 'generating') {
      return c.json({ status: 'generating' }, 202);
    }

    if (entry.status === 'failed') {
      return c.json({
        status: 'failed',
        error: { message: entry.error_message || 'Generation failed' }
      });
    }

    return c.json({
      status: 'ready',
      audioUrl: entry.audio_url,
      title: entry.title,
      duration: entry.duration_seconds,
    });
  });
  ```

### Task 7: Generating State UI (AC: 1)
- [ ] 7.1 Create `components/add/GeneratingState.tsx`:
  ```typescript
  interface GeneratingStateProps {
    title?: string;
    wordCount?: number;
  }

  export function GeneratingState({ title, wordCount }: GeneratingStateProps) {
    return (
      <View className="items-center justify-center p-8">
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text className="mt-4 text-lg font-medium text-amber-900 dark:text-amber-100">
          Generating audio...
        </Text>
        {title && (
          <Text className="mt-2 text-amber-700 dark:text-amber-300 text-center">
            {title}
          </Text>
        )}
        {wordCount && (
          <Text className="mt-1 text-sm text-amber-600 dark:text-amber-400">
            {wordCount.toLocaleString()} words
          </Text>
        )}
        <Text className="mt-4 text-xs text-amber-500">
          This may take a moment...
        </Text>
      </View>
    );
  }
  ```

### Task 8: Mobile Client Integration (AC: all)
- [ ] 8.1 Update `services/api.ts` with generation:
  ```typescript
  export async function generateAudio(
    url: string,
    voiceId: string
  ): Promise<GenerateResult> {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ url, voiceId }),
    });

    const data = await response.json();

    if (response.status === 202) {
      // Polling required
      return pollForCompletion(data.cacheId);
    }

    if (!response.ok) {
      throw new ApiError(data.error.code, data.error.message);
    }

    return data;
  }

  async function pollForCompletion(cacheId: string): Promise<GenerateResult> {
    const maxAttempts = 60; // 2 minutes at 2s interval
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 2000));

      const response = await fetch(`${API_URL}/api/generate/status/${cacheId}`);
      const data = await response.json();

      if (data.status === 'ready') {
        return data;
      }
      if (data.status === 'failed') {
        throw new ApiError('TTS_FAILED', data.error.message);
      }
    }
    throw new ApiError('TIMEOUT', 'Generation took too long');
  }
  ```
- [ ] 8.2 Navigate to player on success

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- Single TTS call to Fish Audio (no chunking)
- Stream response directly to R2
- 120s timeout for TTS requests
- Race condition prevention via INSERT ON CONFLICT
- Polling for concurrent requests

**TTS Generation Flow:**
1. Claim generation (INSERT with status='generating')
2. Parse content (reuse from Stories 2.2/2.3)
3. Call Fish Audio API
4. Stream to R2 storage
5. Update cache entry (status='ready')
6. Add to user's library
7. Return audio URL

### Source Tree Components

```
apps/api/
└── src/
    ├── routes/
    │   └── generate.ts      # POST /api/generate, GET /api/generate/status/:id
    └── services/
        ├── tts.ts           # Fish Audio integration
        └── storage.ts       # R2 upload

apps/mobile/
├── app/(tabs)/
│   └── index.tsx            # Generation flow
├── components/add/
│   └── GeneratingState.tsx  # Progress UI
└── services/
    └── api.ts               # generateAudio(), polling

supabase/migrations/
└── 003_audio_cache.sql
```

### Testing Standards

- Test new URL → audio generated, cached
- Test cached URL → instant response
- Test concurrent requests → one generates, others poll
- Test TTS failure → error shown, cache marked failed
- Test timeout → graceful failure
- Test network error → retry option shown

### Key Technical Decisions

1. **Single TTS Call:** No chunking - simpler, Fish Audio handles long text
2. **Direct R2 Upload:** Stream response to storage without temp files
3. **Polling:** Simple HTTP polling instead of WebSocket (simpler for MVP)
4. **120s Timeout:** Matches architecture spec for long articles

### Dependencies

- Stories 2-2, 2-3 must be completed (content parsing)
- Story 3-1 must be completed (voice selection)
- Fish Audio API access required
- R2 bucket configured

### References

- [Source: architecture-v2.md#Flow-1-Content-Generation]
- [Source: architecture-v2.md#Request-Timeout-Middleware]
- [Source: epics.md#Story-3.2-Streaming-Audio-Generation]
- [Source: prd.md#FR7-FR8]
- [Fish Audio API Documentation](https://fish.audio/docs)

## Dev Agent Record

### Agent Model Used

(To be filled during implementation)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |

### File List

(To be filled after implementation)
