import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const ACTIVE_RULES_PATH = resolve('docs/defensive-rules/ACTIVE.md');

interface Violation {
  rule: string;
  file: string;
  line?: number;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

function getModifiedFiles(): string[] {
  const files = new Set<string>();

  // 1. Commits ahead of origin/main
  try {
    const committed = execSync('git diff --name-only origin/main...HEAD', {
      encoding: 'utf-8',
    }).trim();
    if (committed) {
      for (const f of committed.split('\n')) files.add(f);
    }
  } catch {
    // No remote tracking or no commits — continue to local checks
  }

  // 2. Staged changes (git add'd but not committed)
  try {
    const staged = execSync('git diff --cached --name-only', {
      encoding: 'utf-8',
    }).trim();
    if (staged) {
      for (const f of staged.split('\n')) files.add(f);
    }
  } catch {
    // ignore
  }

  // 3. Unstaged changes (modified but not git add'd)
  try {
    const unstaged = execSync('git diff --name-only', {
      encoding: 'utf-8',
    }).trim();
    if (unstaged) {
      for (const f of unstaged.split('\n')) files.add(f);
    }
  } catch {
    // ignore
  }

  // 4. Untracked new files (created but never git add'd)
  try {
    const untracked = execSync('git ls-files --others --exclude-standard', {
      encoding: 'utf-8',
    }).trim();
    if (untracked) {
      for (const f of untracked.split('\n')) files.add(f);
    }
  } catch {
    // ignore
  }

  return [...files];
}

function getActiveRules(): string[] {
  if (!existsSync(ACTIVE_RULES_PATH)) {
    return [];
  }

  const content = readFileSync(ACTIVE_RULES_PATH, 'utf-8');
  const matches = content.match(/### DR-\d+:.*/g);
  return matches ?? [];
}

function checkTypeScriptStandards(files: string[]): Violation[] {
  const violations: Violation[] = [];
  const tsFiles = files.filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));

  for (const file of tsFiles) {
    const fullPath = resolve(file);
    if (!existsSync(fullPath)) continue;

    const content = readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Zero `any` rule
      if (/:\s*any\b/.test(line) && !/\/\/\s*eslint-disable/.test(line)) {
        violations.push({
          rule: 'CODE_STANDARDS:zero-any',
          file,
          line: lineNum,
          message: 'Uso de `any` detectado. Usar `unknown` + narrowing.',
          severity: 'critical',
        });
      }

      // No non-null assertion
      if (/\w+!\.\w+/.test(line) || /\w+!;/.test(line)) {
        if (!/\.test\./.test(file) && !/\.spec\./.test(file)) {
          violations.push({
            rule: 'CODE_STANDARDS:no-non-null-assertion',
            file,
            line: lineNum,
            message: 'Non-null assertion `!` detectado. Validar antes de acessar.',
            severity: 'warning',
          });
        }
      }

      // No bare throw new Error
      if (
        /throw new Error\(/.test(line) &&
        !/AppError|ValidationError|NotFoundError|IntegrationError|RateLimitError/.test(line)
      ) {
        violations.push({
          rule: 'CODE_STANDARDS:typed-errors',
          file,
          line: lineNum,
          message: 'Uso de `throw new Error()`. Usar hierarquia AppError.',
          severity: 'warning',
        });
      }

      // No silent catch
      if (/catch\s*\(/.test(line)) {
        const nextLines = lines.slice(index + 1, index + 5).join('\n');
        if (
          !nextLines.includes('throw') &&
          !nextLines.includes('logger') &&
          !nextLines.includes('console') &&
          !nextLines.includes('Sentry')
        ) {
          violations.push({
            rule: 'CODE_STANDARDS:no-silent-catch',
            file,
            line: lineNum,
            message: 'Catch sem rethrow ou logging detectado.',
            severity: 'critical',
          });
        }
      }
    });
  }

  return violations;
}

function checkDefensiveRules(files: string[]): Violation[] {
  const violations: Violation[] = [];

  // DR-001: Artax rate limit — chamadas Artax desprotegidas.
  // Só código. Documentação que *descreve* a regra (docs/defensive-rules, incidentes)
  // cita `fetch()` na prosa e disparava a própria regra — um checker que acusa a própria
  // documentação treina o time a ignorar o checker.
  const artaxFiles = files.filter(
    (f) => (f.endsWith('.ts') || f.endsWith('.tsx')) && (f.includes('artax') || f.includes('pms'))
  );
  for (const file of artaxFiles) {
    const fullPath = resolve(file);
    if (!existsSync(fullPath)) continue;

    const content = readFileSync(fullPath, 'utf-8');

    if (
      content.includes('axios.get') ||
      content.includes('axios.post') ||
      content.includes('fetch(')
    ) {
      if (
        !content.includes('rateLimiter') &&
        !content.includes('RateLimiter') &&
        !content.includes('rate-limiter')
      ) {
        violations.push({
          rule: 'DR-001:artax-rate-limit',
          file,
          message: 'Chamada HTTP direta sem rate limiter em arquivo Artax. Ver DR-001.',
          severity: 'critical',
        });
      }
    }
  }

  return violations;
}

function main() {
  console.log('🔍 learn-check v2 — validação com regras defensivas + code standards\n');

  // Step 1: Check active rules exist
  const activeRules = getActiveRules();
  console.log(`📋 ${activeRules.length} regra(s) defensiva(s) ativa(s)`);

  // Step 2: Get modified files
  const modifiedFiles = getModifiedFiles();
  if (modifiedFiles.length === 0) {
    console.log('✓ Nenhum arquivo modificado — nada para verificar');
    process.exit(0);
  }
  console.log(`📁 ${modifiedFiles.length} arquivo(s) modificado(s)\n`);

  // Step 3: Run static checks
  const violations: Violation[] = [
    ...checkTypeScriptStandards(modifiedFiles),
    ...checkDefensiveRules(modifiedFiles),
  ];

  // Step 4: Report
  if (violations.length === 0) {
    console.log('✓ learn-check passed — nenhuma violação encontrada');
    console.log('\n💡 Para revisão profunda com IA, execute: /codex-review');
    process.exit(0);
  }

  const criticals = violations.filter((v) => v.severity === 'critical');
  const warnings = violations.filter((v) => v.severity === 'warning');
  const infos = violations.filter((v) => v.severity === 'info');

  console.log(
    `Found ${violations.length} violation(s): ${criticals.length} critical, ${warnings.length} warning, ${infos.length} info\n`
  );

  for (const v of violations) {
    const icon = v.severity === 'critical' ? '❌' : v.severity === 'warning' ? '⚠️' : 'ℹ️';
    const location = v.line ? `${v.file}:${v.line}` : v.file;
    console.log(`${icon} [${v.rule}] ${location}`);
    console.log(`   ${v.message}\n`);
  }

  if (criticals.length > 0) {
    console.log('🚫 learn-check FAILED — corrija violações críticas antes do PR');
    console.log('💡 Para diagnóstico detalhado com IA: /codex-review');
    process.exit(1);
  }

  console.log('⚠️ learn-check passed com warnings — considere corrigir');
  console.log('💡 Para revisão profunda com IA, execute: /codex-review');
}

main();
