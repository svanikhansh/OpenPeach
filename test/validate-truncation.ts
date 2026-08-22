#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { truncateOutput, TRUNCATE_THRESHOLD } from '../src/lib/truncate-output.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PostToolUsePayload {
  session_id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_response: {
    stdout?: string;
    stderr?: string;
    output?: string;
    [key: string]: unknown;
  };
  cwd: string;
}

interface Fixture {
  name: string;
  path: string;
  payload: PostToolUsePayload;
  importantLines?: string[];
  shouldTruncate: boolean;
}

async function loadFixtures(): Promise<Fixture[]> {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const files = await fs.readdir(fixturesDir);
  const fixtures: Fixture[] = [];

  for (const file of files) {
    if (file.endsWith('.json')) {
      const content = await fs.readFile(path.join(fixturesDir, file), 'utf8');
      const payload = JSON.parse(content) as PostToolUsePayload;

      const response = payload.tool_response;
      const output = response.output ?? response.stdout ?? response.stderr ?? '';

      let importantLines: string[] = [];
      let shouldTruncate = output.length > TRUNCATE_THRESHOLD;

      if (file.includes('test-suite-failure') || file.includes('pytest-output')) {
        importantLines = [
          'test_checkout_flow',
          'AssertionError: assert False == True'
        ];
      } else if (file.includes('git-diff-large')) {
        importantLines = [
          'src/components/ImportantChange.tsx',
          'const [loading, setLoading] = true'
        ];
      } else if (file.includes('grep-result')) {
        importantLines = [
          'src/components/ImportantChange.tsx:15:  // REAL BUG: Missing await causes silent data loss in production'
        ];
      } else if (file.includes('json-dump')) {
        importantLines = [];
      } else if (file.includes('short-output') || file.includes('build-output')) {
        importantLines = [];
      } else if (file.includes('many-errors')) {
        importantLines = [
          'ERROR: Connection timeout',
          'FAIL: test_user_login',
          'Exception: NullPointerException',
          'AssertionError: expected true got false',
          'Traceback (most recent call last)',
          'FAIL: test_payment_process',
          'ERROR: Database connection failed',
          'assert response.status == 200',
          'Expected: 200',
          'Received: 500',
          'FAIL: test_inventory_check',
          'Exception: OutOfMemoryError',
          'FAIL: test_email_send',
          'AssertionError: assert user != null'
        ];
      } else if (file.includes('scattered-errors')) {
        importantLines = [
          'ERROR: scattered failure 01',
          'ERROR: scattered failure 12'
        ];
      }

      fixtures.push({
        name: file.replace('.json', ''),
        path: path.join(fixturesDir, file),
        payload,
        importantLines,
        shouldTruncate
      });
    }
  }

  return fixtures.sort((a, b) => a.name.localeCompare(b.name));
}

async function validateFixture(fixture: Fixture): Promise<{ passed: boolean; details: string[] }> {
  const response = fixture.payload.tool_response;
  const output = response.output ?? response.stdout ?? response.stderr ?? '';

  const details: string[] = [];
  let passed = true;

  const { truncated, originalChars, truncatedChars } = truncateOutput(output);
  const wasTruncated = originalChars !== truncatedChars;

  details.push(`  Original: ${originalChars} chars, ${output.split('\n').length} lines`);
  details.push(`  Truncated: ${truncatedChars} chars (${wasTruncated ? 'YES' : 'NO'})`);

  if (fixture.shouldTruncate && !wasTruncated) {
    details.push(`  ❌ FAIL: Expected truncation but output was not truncated`);
    passed = false;
  } else if (!fixture.shouldTruncate && wasTruncated) {
    details.push(`  ❌ FAIL: Unexpected truncation on short output`);
    passed = false;
  } else if (fixture.shouldTruncate && wasTruncated) {
    details.push(`  ✓ Truncation triggered as expected`);
    const savings = Math.round((originalChars - truncatedChars) / 4);
    details.push(`  Tokens saved estimate: ~${savings}`);
  } else {
    details.push(`  ✓ No truncation needed (under threshold)`);
  }

  if (fixture.name === 'scattered-errors' && !truncated.includes('[...+')) {
    details.push('  ❌ FAIL: Expected the anchor cap marker for scattered errors');
    passed = false;
  } else if (fixture.name === 'scattered-errors') {
    details.push('  ✓ Anchor cap marker emitted for scattered errors');
  }

  // Check important lines are preserved
  for (const importantLine of fixture.importantLines) {
    const inOriginal = output.includes(importantLine);
    const inTruncated = truncated.includes(importantLine);

    if (inOriginal && !inTruncated) {
      details.push(`  ❌ FAIL: Important line LOST after truncation:`);
      details.push(`    "${importantLine}"`);
      passed = false;
    } else if (inOriginal && inTruncated) {
      details.push(`  ✓ Important line PRESERVED: "${importantLine.substring(0, 80)}${importantLine.length > 80 ? '...' : ''}"`);
    } else if (!inOriginal) {
      details.push(`  ⚠ Important line not found in original: "${importantLine.substring(0, 80)}${importantLine.length > 80 ? '...' : ''}"`);
    }
  }

  return { passed, details };
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  OpenPeach Truncation Heuristic Validation');
  console.log('═══════════════════════════════════════════════════════════\n');

  const fixtures = await loadFixtures();
  console.log(`Loaded ${fixtures.length} fixtures\n`);

  let allPassed = true;
  const results: { name: string; passed: boolean; details: string[] }[] = [];

  for (const fixture of fixtures) {
    console.log(`▶ ${fixture.name}`);
    const result = await validateFixture(fixture);
    results.push({ name: fixture.name, ...result });

    for (const detail of result.details) {
      console.log(detail);
    }

    console.log(result.passed ? '  ✅ PASS\n' : '  ❌ FAIL\n');
    if (!result.passed) allPassed = false;
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');

  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status}  ${result.name}`);
  }

  console.log('');
  if (allPassed) {
    console.log('  All fixtures passed! ✅');
    process.exit(0);
  } else {
    console.log('  Some fixtures failed! ❌');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Validation script error:', err);
  process.exit(1);
});