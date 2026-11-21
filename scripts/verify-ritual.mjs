#!/usr/bin/env node
/**
 * Mechanical Closeout Ritual, Hot Context Budget & Secret Hygiene Verifier.
 * Modes:
 *   --ci        Safe for PR CI and baseline verification (allows local main with warning)
 *   --closeout  Strict Phase 4 release gate (requires non-main branch locally)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const args = new Set(process.argv.slice(2));
const isCloseout = args.has('--closeout');

const ROOT = process.cwd();
const HOT_CONTEXT_LIMIT_BYTES = 20 * 1024; // 20 KB hard limit
const HOT_CONTEXT_WARN_BYTES = 17.5 * 1024;

let failures = 0;
let warnings = 0;

function pass(msg) {
  console.log(`  [PASS] ${msg}`);
}

function warn(msg) {
  warnings++;
  console.warn(`  [WARN] ${msg}`);
}

function fail(msg) {
  failures++;
  console.error(`  [FAIL] ${msg}`);
}

function readText(relPath) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

function git(cmdArgs) {
  return execFileSync('git', cmdArgs, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function parseSemver(v) {
  const clean = String(v).replace(/^v/i, '').trim();
  const match = clean.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  return match.slice(1).map(Number);
}

function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return NaN;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

console.log('==========================================================');
console.log(` DIARY REPOSITORY RITUAL CHECK (${isCloseout ? 'STRICT CLOSEOUT' : 'CI / PRE-FLIGHT'})`);
console.log('==========================================================\n');

// 1. Required Governance Files
console.log('1. Checking required governance & memory files...');
const requiredFiles = [
  'AGENTS.md',
  'GEMINI.md',
  '.agents/skills/version-ritual/SKILL.md',
  'docs/versions/00-template.md',
  'docs/DECISIONS_MASTER.md',
  'docs/blueprint/main_blueprint.md',
  'docs/blueprint/v1.0_blueprint.md',
  'docs/APP_JOURNEY_LOG.md',
  'docs/handovers/CURRENT_HANDOVER.md',
];

for (const rel of requiredFiles) {
  if (fs.existsSync(path.join(ROOT, rel))) {
    pass(`Exists: ${rel}`);
  } else {
    fail(`Missing required governance file: ${rel}`);
  }
}

// 2. Gitignore Protection for Private Files
console.log('\n2. Checking gitignore quarantine for sensitive local files...');
const quarantinedPaths = ['.agents/AGENTS.md', '.agents/plugins', '.env.local', 'powershell.bat', 'powershell.cmd'];
for (const qPath of quarantinedPaths) {
  const tracked = git(['ls-files', '--', qPath]);
  if (tracked) {
    fail(`Quarantined local/sensitive file is tracked in git: ${qPath}`);
  } else {
    pass(`Not tracked in git: ${qPath}`);
  }
}

// 3. Branch Discipline
console.log('\n3. Checking branch discipline...');
const ghEvent = process.env.GITHUB_EVENT_NAME;
const ghHeadRef = process.env.GITHUB_HEAD_REF;
const ghBaseRef = process.env.GITHUB_BASE_REF;

if (ghEvent === 'pull_request') {
  if (!ghHeadRef || ghHeadRef === 'main') {
    fail(`PR head branch must not be 'main' (got '${ghHeadRef || 'unknown'}')`);
  } else {
    pass(`PR branch '${ghHeadRef}' targeting '${ghBaseRef || 'main'}'`);
  }
} else {
  const currentBranch = git(['branch', '--show-current']);
  if (!currentBranch) {
    if (isCloseout) {
      fail('Detached HEAD is not permitted during closeout.');
    } else {
      warn('Detached HEAD detected in CI/local check.');
    }
  } else if (currentBranch === 'main') {
    if (isCloseout) {
      fail("Closeout cannot run directly on 'main'. Switch to a feat/ or fix/ branch.");
    } else {
      warn("Currently on 'main' (acceptable for baseline check; use a feature branch before editing).");
    }
  } else {
    pass(`Active working branch: ${currentBranch}`);
  }
}

// 4. Version Manifest & Dossier Sync
console.log('\n4. Checking version synchronization across manifests, dossier, and log...');
const pkgRaw = readText('package.json');
const lockRaw = readText('package-lock.json');
let currentVersion = null;

if (pkgRaw) {
  const pkg = JSON.parse(pkgRaw);
  currentVersion = pkg.version;
  if (parseSemver(currentVersion)) {
    pass(`package.json version: v${currentVersion}`);
  } else {
    fail(`Invalid package.json semver: ${currentVersion}`);
  }

  if (lockRaw) {
    const lock = JSON.parse(lockRaw);
    const rootLockVer = lock.packages?.['']?.version;
    if (lock.version === currentVersion && rootLockVer === currentVersion) {
      pass(`package-lock.json synced at v${currentVersion}`);
    } else {
      fail(`package-lock.json mismatch (lock=${lock.version}, rootPkg=${rootLockVer}, expected=${currentVersion})`);
    }
  } else {
    fail('Missing package-lock.json');
  }

  const dossierPath = `docs/versions/v${currentVersion}.md`;
  const dossier = readText(dossierPath);
  if (dossier && dossier.trim().length > 100) {
    pass(`Dossier exists and populated: ${dossierPath}`);
  } else {
    fail(`Missing or empty version dossier: ${dossierPath}`);
  }

  const journeyLog = readText('docs/APP_JOURNEY_LOG.md');
  if (journeyLog) {
    const topMatch = journeyLog.match(/^###\s+\[v(\d+\.\d+\.\d+)\]/m);
    if (topMatch && topMatch[1] === currentVersion) {
      pass(`APP_JOURNEY_LOG.md top entry matches v${currentVersion}`);
    } else {
      fail(`APP_JOURNEY_LOG.md top entry is v${topMatch?.[1] || 'none'}, expected v${currentVersion}`);
    }
  }
} else {
  fail('Cannot read package.json');
}

// 5. Handover Baton Rotation Check
console.log('\n5. Checking CURRENT_HANDOVER.md baseline & baton rotation...');
const handover = readText('docs/handovers/CURRENT_HANDOVER.md');
if (handover && currentVersion) {
  const baseMatch = handover.match(/\*\*Current Repository Version\*\*:\s*`?v?(\d+\.\d+\.\d+)`?/i);
  const nextMatch = handover.match(/\*\*Target Version\*\*:\s*`?v?(\d+\.\d+\.\d+)`?/i);
  const hasStarter = /##\s+5\.\s+Copy-Paste Starter Prompt/i.test(handover);

  if (baseMatch && baseMatch[1] === currentVersion) {
    pass(`Handover Current Repository Version matches v${currentVersion}`);
  } else {
    fail(`Handover Current Repository Version is v${baseMatch?.[1] || 'missing'}, expected v${currentVersion}`);
  }

  if (nextMatch && compareSemver(nextMatch[1], currentVersion) > 0) {
    pass(`Handover next Target Version rotated cleanly to v${nextMatch[1]} (> v${currentVersion})`);
  } else {
    fail(`Handover next Target Version (v${nextMatch?.[1] || 'missing'}) must be greater than v${currentVersion}`);
  }

  if (hasStarter) {
    pass('Handover contains Section 5 Copy-Paste Starter Prompt');
  } else {
    fail('Handover is missing Section 5 Copy-Paste Starter Prompt');
  }
}

// 6. Hot Context < 20 KB Budget Check
console.log('\n6. Checking < 20 KB Hot Context budget...');
const hotFiles = [
  'docs/handovers/CURRENT_HANDOVER.md',
  'docs/DECISIONS_MASTER.md',
  'docs/blueprint/v1.0_blueprint.md',
];
let totalHotBytes = 0;
for (const hf of hotFiles) {
  const fp = path.join(ROOT, hf);
  if (fs.existsSync(fp)) {
    const size = fs.statSync(fp).size;
    totalHotBytes += size;
    console.log(`     - ${hf}: ${size} bytes`);
  }
}
const kb = (totalHotBytes / 1024).toFixed(2);
if (totalHotBytes > HOT_CONTEXT_LIMIT_BYTES) {
  fail(`Hot Context total is ${totalHotBytes} bytes (${kb} KB), exceeding 20 KB (${HOT_CONTEXT_LIMIT_BYTES} bytes) cap!`);
} else if (totalHotBytes > HOT_CONTEXT_WARN_BYTES) {
  warn(`Hot Context total is ${totalHotBytes} bytes (${kb} KB) — approaching 20 KB limit; consider pruning old rows.`);
} else {
  pass(`Hot Context total is ${totalHotBytes} bytes (${kb} KB <= 20 KB)`);
}

// 7. Secret, Credential & Privacy Scan
console.log('\n7. Scanning tracked and staged files for secrets & local path leaks...');
const trackedFilesRaw = git(['ls-files']);
const stagedFilesRaw = git(['diff', '--cached', '--name-only', '--diff-filter=ACMR']);
const untrackedFilesRaw = git(['ls-files', '--others', '--exclude-standard']);
const candidateSet = new Set([
  ...trackedFilesRaw.split(/\r?\n/).filter(Boolean),
  ...stagedFilesRaw.split(/\r?\n/).filter(Boolean),
  ...untrackedFilesRaw.split(/\r?\n/).filter(Boolean),
]);

const textExts = new Set(['.md', '.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.yml', '.yaml', '.html', '.css', '.sql', '.py']);
const forbiddenTestEmail = ['testuser', 'diary.com'].join('@');
const forbiddenTestPass = ['test', '4321'].join('@');

const secretFindings = [];

for (const rel of candidateSet) {
  if (rel === 'package-lock.json') continue;
  const ext = path.extname(rel).toLowerCase();
  if (!textExts.has(ext)) continue;

  const fullPath = path.join(ROOT, rel);
  if (!fs.existsSync(fullPath)) continue;
  const content = fs.readFileSync(fullPath, 'utf8');

  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(content)) {
    secretFindings.push(`${rel}: Private key block detected`);
  }
  if (/\bsbp_[A-Za-z0-9]{20,}\b/.test(content)) {
    secretFindings.push(`${rel}: Supabase personal access token (sbp_...) detected`);
  }
  if (/[A-Za-z]:\\Users\\[A-Za-z0-9._-]+/i.test(content)) {
    secretFindings.push(`${rel}: Local OS user home path detected`);
  }

  // Decode JWT payloads to catch hardcoded service_role tokens without false-positiving on public anon keys
  const jwtMatches = content.match(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g) || [];
  for (const jwt of jwtMatches) {
    try {
      const payload = Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8');
      if (/"role"\s*:\s*"service_role"/.test(payload)) {
        secretFindings.push(`${rel}: Hardcoded Supabase service_role JWT detected`);
      }
    } catch {
      // Ignore malformed base64 fragments
    }
  }

  // Check strict credential quarantine outside tests/ and verification/
  const isExemptTestHarness = rel.startsWith('tests/') || rel.startsWith('verification/');
  if (!isExemptTestHarness) {
    if (content.toLowerCase().includes(forbiddenTestEmail) || content.includes(forbiddenTestPass)) {
      secretFindings.push(`${rel}: Literal test credential quarantined to .agents/AGENTS.md leaked into tracked file`);
    }
  }
}

if (secretFindings.length > 0) {
  for (const f of secretFindings) fail(f);
} else {
  pass(`Scanned ${candidateSet.size} candidate files: 0 secret, credential, or path leaks`);
}

console.log('\n==========================================================');
console.log(` RESULT: ${failures} failure(s), ${warnings} warning(s)`);
console.log('==========================================================');

if (failures > 0) {
  process.exit(1);
}
