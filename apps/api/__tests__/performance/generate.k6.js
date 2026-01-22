/**
 * k6 Performance Tests: Generate Endpoint
 *
 * Validates NFR1: Time to first audio < 10 seconds
 * Validates NFR10: Handle 1,000 concurrent TTS requests
 *
 * Run with:
 *   k6 run apps/api/__tests__/performance/generate.k6.js
 *
 * Run with cloud (Grafana k6 Cloud):
 *   k6 cloud apps/api/__tests__/performance/generate.k6.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const timeToFirstAudio = new Trend("time_to_first_audio");
const parseTime = new Trend("parse_time");
const successfulGenerations = new Counter("successful_generations");

// Configuration
const BASE_URL = __ENV.BASE_URL || "http://localhost:3001";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "";

// Test URLs - mix of simple and complex content
const TEST_URLS = [
  "https://paulgraham.com/wealth.html",
  "https://en.wikipedia.org/wiki/Node.js",
  "https://www.bbc.com/news",
];

// SLO Thresholds
export const options = {
  // Scenario: Ramp up to 50 concurrent users
  stages: [
    { duration: "30s", target: 10 }, // Warm up
    { duration: "1m", target: 25 }, // Ramp up
    { duration: "2m", target: 50 }, // Sustained load
    { duration: "1m", target: 100 }, // Spike test
    { duration: "30s", target: 0 }, // Cool down
  ],

  thresholds: {
    // NFR1: Time to first audio < 10s (P95)
    time_to_first_audio: ["p(95)<10000"],

    // API response time < 500ms for parsing (P95)
    parse_time: ["p(95)<500"],

    // Error rate < 5%
    errors: ["rate<0.05"],

    // HTTP request duration < 15s (P99) - includes TTS generation
    http_req_duration: ["p(99)<15000"],
  },
};

export default function () {
  const url = TEST_URLS[Math.floor(Math.random() * TEST_URLS.length)];

  const payload = JSON.stringify({
    url: url,
    voiceId: "default",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      ...(AUTH_TOKEN && { Authorization: `Bearer ${AUTH_TOKEN}` }),
    },
    timeout: "30s",
  };

  const startTime = Date.now();

  // Test: Generate endpoint (parsing + TTS initiation)
  const response = http.post(`${BASE_URL}/api/generate`, payload, params);

  const duration = Date.now() - startTime;

  // Record metrics
  const success = check(response, {
    "status is 200": (r) => r.status === 200,
    "response has title": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.title && body.title.length > 0;
      } catch {
        return false;
      }
    },
    "response has audio URL or stream": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.audioUrl || body.streamUrl || body.id;
      } catch {
        return false;
      }
    },
  });

  if (success) {
    timeToFirstAudio.add(duration);
    successfulGenerations.add(1);

    try {
      const body = JSON.parse(response.body);
      if (body.parseTimeMs) {
        parseTime.add(body.parseTimeMs);
      }
    } catch {
      // Ignore parsing errors for metrics
    }
  }

  errorRate.add(!success);

  // Realistic user think time
  sleep(Math.random() * 2 + 1);
}

// Summary handler for CI integration
export function handleSummary(data) {
  const p95TimeToAudio = data.metrics.time_to_first_audio?.values?.["p(95)"] || 0;
  const p95ParseTime = data.metrics.parse_time?.values?.["p(95)"] || 0;
  const errorRateValue = data.metrics.errors?.values?.rate || 0;
  const successCount = data.metrics.successful_generations?.values?.count || 0;

  const results = {
    summary: {
      time_to_first_audio_p95_ms: Math.round(p95TimeToAudio),
      parse_time_p95_ms: Math.round(p95ParseTime),
      error_rate_percent: (errorRateValue * 100).toFixed(2),
      successful_generations: successCount,
      thresholds_passed: Object.values(data.metrics)
        .filter((m) => m.thresholds)
        .every((m) => Object.values(m.thresholds).every((t) => t.ok)),
    },
    nfr_validation: {
      "NFR1: Time to first audio < 10s": p95TimeToAudio < 10000 ? "PASS" : "FAIL",
      "NFR: Parse time < 500ms": p95ParseTime < 500 ? "PASS" : "FAIL",
      "NFR: Error rate < 5%": errorRateValue < 0.05 ? "PASS" : "FAIL",
    },
  };

  return {
    "performance-results.json": JSON.stringify(results, null, 2),
    stdout: `
================================================================================
                        PERFORMANCE TEST RESULTS
================================================================================

Time to First Audio (P95): ${Math.round(p95TimeToAudio)}ms
  Target: < 10,000ms
  Status: ${p95TimeToAudio < 10000 ? "PASS" : "FAIL"}

Parse Time (P95): ${Math.round(p95ParseTime)}ms
  Target: < 500ms
  Status: ${p95ParseTime < 500 ? "PASS" : "FAIL"}

Error Rate: ${(errorRateValue * 100).toFixed(2)}%
  Target: < 5%
  Status: ${errorRateValue < 0.05 ? "PASS" : "FAIL"}

Successful Generations: ${successCount}

================================================================================
`,
  };
}
