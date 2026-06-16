import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ACTIVE_RULES_PATH = resolve('docs/defensive-rules/ACTIVE.md');

function main() {
  if (!existsSync(ACTIVE_RULES_PATH)) {
    console.log('⚠ docs/defensive-rules/ACTIVE.md not found');
    process.exit(1);
  }

  const content = readFileSync(ACTIVE_RULES_PATH, 'utf-8');
  const ruleMatches = content.match(/### DR-\d+/g);

  if (!ruleMatches) {
    console.log('✓ No defensive rules active yet — nothing to check');
    process.exit(0);
  }

  console.log(`Found ${ruleMatches.length} active defensive rule(s)`);
  console.log('✓ learn-check passed');
}

main();
