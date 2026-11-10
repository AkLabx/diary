# Production Monitoring, Alerts & Observability Architecture

**Target Project Ref**: `ccgiozknvlknbrkzfcdx`  
**Observability Model**: Zero-PII Client Telemetry + Server-Side Performance Alerts  

---

## 1. Alerting Matrix & Thresholds

| Alert Name | Metric & Query | Threshold | Evaluation Window | Severity | Action / Mitigation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pool Saturation** | PostgREST active connection pooler ratio | `active_connections / pool_size > 0.80` | Sustained 2 min | **HIGH** | Scale Supavisor pooler mode from Session to Transaction, or increase small compute pool allocation. |
| **High CPU Load** | Host CPU utilization percentage | `cpu_usage_percent > 70%` | Sustained 5 min | **MEDIUM** | Inspect slow queries via `pg_stat_statements`; verify covering indexes on `owner_id` and `created_at`. |
| **Disk I/O Exhaustion** | EBS / disk IOPS burst balance | `disk_iops_consumed_percent > 80%` | Instantaneous | **HIGH** | Autoscale disk storage or inspect image upload frequencies. |
| **API Error Budget Breach**| HTTP 5xx responses from PostgREST / Storage | `5xx_count / total_requests > 0.01` | 5 min rolling window | **CRITICAL** | Page on-call engineering; inspect Edge Function `weather-proxy` and `delete-account` logs. |
| **Client Crash Surge** | Anonymized telemetry exceptions reported in `lib/telemetry.ts` | `unhandled_exceptions > 10 / min` | 1 min | **HIGH** | Inspect client component stack traces; verify browser Web Crypto API compatibility. |

---

## 2. Real-Time Diagnostic SQL Queries for SRE & On-Call

### A. Connection Pooler Inspection
```sql
SELECT 
  count(*) AS total_connections,
  count(CASE WHEN state = 'active' THEN 1 END) AS active_queries,
  count(CASE WHEN state = 'idle' THEN 1 END) AS idle_connections,
  count(CASE WHEN state = 'idle in transaction' THEN 1 END) AS idle_in_transaction
FROM pg_stat_activity
WHERE datname = current_database();
```

### B. Long-Running Queries Detection (> 5 seconds)
```sql
SELECT 
  pid,
  now() - query_start AS duration,
  state,
  query
FROM pg_stat_activity
WHERE state != 'idle' 
  AND now() - query_start > interval '5 seconds'
ORDER BY duration DESC;
```

### C. Dead-Letter Outbox Queue Health
Inspect client-side telemetry buffer via developer console:
```javascript
import { getAnonymizedDiagnostics } from './lib/telemetry';
console.table(getAnonymizedDiagnostics());
```

---

## 3. Privacy-Preserving Telemetry Hard Invariants
1. **Zero User PII**: Telemetry payloads sent to monitoring endpoints must never contain user emails, passwords, auth tokens (`Bearer ...`, JWTs), or IP addresses.
2. **Zero Plaintext Content**: Titles, entries, and image paths are scrubbed client-side via `scrubPII` in `lib/telemetry.ts` before reaching memory storage.
3. **Fail-Safe Design**: Telemetry execution is wrapped in `try/catch` and executes strictly asynchronously, ensuring telemetry outages never degrade user experience.
