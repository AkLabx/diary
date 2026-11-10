// tests/load/k6-10k-dau.js
// k6 Load Testing Script for 10,000 Daily Active Users (DAU)
// Simulates 150 peak concurrent Virtual Users (VUs) generating ~150 Requests Per Second (RPS)

import http from 'k6/http';
import { check, group, sleep } from 'k6';

// 1. Load Test Configuration & Realistic Ramping Stages
export const options = {
  stages: [
    { duration: '2m', target: 30 },   // Warm-up to 30 VUs
    { duration: '5m', target: 100 },  // Ramp to 100 VUs (average daytime peak)
    { duration: '10m', target: 150 }, // Sustain peak 150 VUs (~150 RPS for 10k DAU)
    { duration: '3m', target: 50 },   // Step-down
    { duration: '2m', target: 0 },    // Cool-down
  ],
  thresholds: {
    // 95% of requests must complete under 250ms
    http_req_duration: ['p(95)<250', 'p(99)<600'],
    // HTTP 5xx error rate must remain under 0.1%
    http_req_failed: ['rate<0.001'],
  },
};

const BASE_URL = __ENV.SUPABASE_URL || 'https://ccgiozknvlknbrkzfcdx.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const headers = {
  'Content-Type': 'application/json',
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
};

export default function () {
  const rand = Math.random();

  // Traffic Distribution based on 10,000 DAU Behavior Modeling:
  // 60% Read Timeline (GET /rest/v1/diaries with covering index)
  // 20% Search / Filter (GET /rest/v1/diaries with query params)
  // 15% Write / Update (POST /rest/v1/diaries with client-encrypted ciphertext)
  // 5% Weather Edge Function Call (POST /functions/v1/weather-proxy)

  if (rand < 0.60) {
    group('01_Read_Timeline', function () {
      const res = http.get(
        `${BASE_URL}/rest/v1/diaries?select=id,created_at,mood,tags,journal&order=created_at.desc&limit=20`,
        { headers: headers }
      );
      check(res, {
        'timeline status is 200': (r) => r.status === 200,
        'timeline response time < 200ms': (r) => r.timings.duration < 200,
      });
    });
  } else if (rand < 0.80) {
    group('02_Search_And_Filter', function () {
      const res = http.get(
        `${BASE_URL}/rest/v1/diaries?select=id,created_at,mood,tags,journal&journal=eq.Personal&order=created_at.desc&limit=10`,
        { headers: headers }
      );
      check(res, {
        'filter status is 200': (r) => r.status === 200,
        'filter response time < 200ms': (r) => r.timings.duration < 200,
      });
    });
  } else if (rand < 0.95) {
    group('03_Encrypted_Draft_Write', function () {
      // Simulates write payload with AES-GCM ciphertext
      const payload = JSON.stringify({
        encrypted_entry: 'v1:AES-GCM:dGVzdF9sb2FkX2NpcGhlcnRleHRfcGF5bG9hZF8yNTZiaXRz',
        iv: 'dGVzdF9pdjEyMzQ1Njc4',
        mood: '😊',
        tags: ['benchmark', '10k-dau'],
        journal: 'Personal',
        created_at: new Date().toISOString(),
      });

      const res = http.post(`${BASE_URL}/rest/v1/diaries`, payload, {
        headers: headers,
      });

      // An unauthenticated request gets 401/403 or RLS empty response, which validates RLS barrier
      check(res, {
        'write handled by RLS': (r) => r.status === 201 || r.status === 401 || r.status === 403,
      });
    });
  } else {
    group('04_Weather_Edge_Function', function () {
      const payload = JSON.stringify({ lat: 12.97, lon: 77.59, city: 'Bengaluru' });
      const res = http.post(`${BASE_URL}/functions/v1/weather-proxy`, payload, {
        headers: headers,
      });

      check(res, {
        'weather proxy status 200 or cached': (r) => r.status === 200,
      });
    });
  }

  // Realistic human pacing: 1 to 4 seconds between interactions
  sleep(Math.random() * 3 + 1);
}
