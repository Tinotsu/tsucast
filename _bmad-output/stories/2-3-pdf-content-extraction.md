# Story 2.3: PDF Content Extraction

Status: ready-for-dev

## Story

As a user with a PDF document,
I want to extract text from it,
so that I can listen to PDF content as audio.

## Acceptance Criteria

1. **AC1: PDF URL Detection**
   - Given user pastes a URL ending in .pdf
   - When the API processes it
   - Then PDF is downloaded
   - And text is extracted using pdf-parse
   - And title is derived from filename or metadata

2. **AC2: Word Count Validation**
   - Given PDF has > 15,000 words
   - When extraction completes
   - Then request is rejected with word count error

3. **AC3: Image-Only PDF Handling**
   - Given PDF is image-based (scanned)
   - When no text is extractable
   - Then user sees: "This PDF contains images only. Text-based PDFs work best."

## Tasks / Subtasks

### Task 1: PDF Parser Setup (AC: 1)
- [ ] 1.1 Install pdf-parse library:
  ```bash
  npm install pdf-parse
  npm install -D @types/pdf-parse
  ```
- [ ] 1.2 Create `apps/api/src/services/pdfParser.ts`:
  ```typescript
  import pdf from 'pdf-parse';

  export interface PdfParseResult {
    title: string;
    textContent: string;
    wordCount: number;
    pageCount: number;
  }

  export async function parsePdfContent(
    buffer: Buffer,
    filename: string
  ): Promise<PdfParseResult> {
    const data = await pdf(buffer);

    const textContent = data.text.trim();
    const wordCount = textContent
      .split(/\s+/)
      .filter(word => word.length > 0).length;

    // Extract title from metadata or filename
    const title = data.info?.Title ||
      filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');

    return {
      title,
      textContent,
      wordCount,
      pageCount: data.numpages
    };
  }
  ```

### Task 2: PDF URL Detection (AC: 1)
- [ ] 2.1 Update `apps/api/src/services/fetcher.ts` to detect PDF:
  ```typescript
  export function isPdfUrl(url: string): boolean {
    const parsed = new URL(url);
    return parsed.pathname.toLowerCase().endsWith('.pdf');
  }

  export async function fetchPdf(url: string): Promise<Buffer> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; tsucast/1.0)',
      },
      signal: AbortSignal.timeout(60000), // 60s for large PDFs
    });

    if (!response.ok) {
      throw new Error(`FETCH_FAILED: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  ```
- [ ] 2.2 Extract filename from URL or Content-Disposition header

### Task 3: Integrate PDF Parsing into Generate Route (AC: 1, 2, 3)
- [ ] 3.1 Update `apps/api/src/routes/generate.ts`:
  ```typescript
  generate.post('/generate', async (c) => {
    const { url, voiceId } = await c.req.json();

    // Detect content type
    const isPdf = isPdfUrl(url);

    let parsed;
    if (isPdf) {
      // PDF flow
      const buffer = await fetchPdf(url);
      const filename = new URL(url).pathname.split('/').pop() || 'document.pdf';

      try {
        parsed = await parsePdfContent(buffer, filename);
      } catch (error) {
        return c.json({
          error: { code: 'PARSE_FAILED', message: "Couldn't extract text from this PDF" }
        }, 422);
      }

      // Check for image-only PDF
      if (parsed.wordCount < 50 && parsed.pageCount > 0) {
        return c.json({
          error: {
            code: 'IMAGE_ONLY_PDF',
            message: 'This PDF contains images only. Text-based PDFs work best.'
          }
        }, 422);
      }
    } else {
      // HTML flow (existing code)
      const html = await fetchUrl(url);
      parsed = await parseHtmlContent(html, url);
    }

    // Word count validation (shared)
    if (parsed.wordCount > 15000) {
      return c.json({
        error: {
          code: 'ARTICLE_TOO_LONG',
          message: `Document is too long (${parsed.wordCount.toLocaleString()} words, max 15,000)`
        }
      }, 422);
    }

    return c.json({
      title: parsed.title,
      wordCount: parsed.wordCount,
      contentType: isPdf ? 'pdf' : 'html'
    });
  });
  ```

### Task 4: Image-Only PDF Detection (AC: 3)
- [ ] 4.1 Implement heuristic for scanned PDFs:
  - Low word count relative to page count
  - Text is mostly whitespace or garbage characters
  ```typescript
  function isImageOnlyPdf(result: PdfParseResult): boolean {
    // Less than 50 words total, or < 20 words per page
    if (result.wordCount < 50) return true;
    if (result.pageCount > 0 && result.wordCount / result.pageCount < 20) return true;

    // Check for garbage characters (OCR artifacts)
    const garbageRatio = (result.textContent.match(/[^\x20-\x7E\n]/g) || []).length /
      result.textContent.length;
    if (garbageRatio > 0.3) return true;

    return false;
  }
  ```
- [ ] 4.2 Return specific error for image-only PDFs

### Task 5: PDF Size Limits (AC: 2)
- [ ] 5.1 Add file size validation (max 50MB):
  ```typescript
  const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB

  export async function fetchPdf(url: string): Promise<Buffer> {
    const response = await fetch(url, { /* ... */ });

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_PDF_SIZE) {
      throw new Error('PDF_TOO_LARGE');
    }

    // Also check during download
    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    for await (const chunk of response.body) {
      totalSize += chunk.length;
      if (totalSize > MAX_PDF_SIZE) {
        throw new Error('PDF_TOO_LARGE');
      }
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }
  ```
- [ ] 5.2 Add error message for oversized PDFs

### Task 6: Password-Protected PDF Handling (AC: 3)
- [ ] 6.1 Catch pdf-parse error for encrypted PDFs:
  ```typescript
  try {
    parsed = await parsePdfContent(buffer, filename);
  } catch (error) {
    if (error.message.includes('password')) {
      return c.json({
        error: {
          code: 'PDF_PASSWORD_PROTECTED',
          message: 'This PDF is password-protected and cannot be processed.'
        }
      }, 422);
    }
    throw error;
  }
  ```

### Task 7: Mobile Client Updates (AC: all)
- [ ] 7.1 Update URL validation to recognize PDF URLs:
  ```typescript
  export function getUrlType(url: string): 'html' | 'pdf' {
    try {
      const parsed = new URL(url);
      return parsed.pathname.toLowerCase().endsWith('.pdf') ? 'pdf' : 'html';
    } catch {
      return 'html';
    }
  }
  ```
- [ ] 7.2 Show PDF indicator in UI when PDF URL detected
- [ ] 7.3 Handle PDF-specific error messages

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- PDF parsing on VPS (no Edge Function limits)
- Same 15,000 word limit as HTML
- pdf-parse library for text extraction
- No OCR support (image PDFs not processed)

**PDF Processing Flow:**
1. Detect PDF URL (.pdf extension)
2. Download PDF as buffer
3. Extract text with pdf-parse
4. Check for image-only PDF
5. Validate word count
6. Return parsed content

### Source Tree Components

```
apps/api/
└── src/
    ├── routes/
    │   └── generate.ts      # Updated with PDF branch
    └── services/
        ├── fetcher.ts       # fetchPdf(), isPdfUrl()
        └── pdfParser.ts     # parsePdfContent()
```

### Testing Standards

- Test valid text PDF → extraction succeeds
- Test large PDF (> 15,000 words) → word count error
- Test image-only PDF → appropriate error
- Test password-protected PDF → appropriate error
- Test oversized PDF (> 50MB) → size error
- Test PDF with metadata title → uses metadata
- Test PDF without metadata → uses filename

### Key Technical Decisions

1. **pdf-parse:** Reliable, well-maintained PDF parsing library
2. **No OCR:** Image-only PDFs not supported (complexity, cost)
3. **50MB Limit:** Reasonable for most documents, prevents abuse
4. **Streaming Download:** Prevents memory issues with large files

### Dependencies

- Story 2-2 must be completed (HTML extraction exists)
- VPS API server must be running

### References

- [Source: architecture-v2.md#Flow-1-Content-Generation]
- [Source: epics.md#Story-2.3-PDF-Content-Extraction]
- [Source: prd.md#FR2-FR4]
- [pdf-parse npm](https://www.npmjs.com/package/pdf-parse)

## Dev Agent Record

### Agent Model Used

(To be filled during implementation)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |

### File List

(To be filled after implementation)
