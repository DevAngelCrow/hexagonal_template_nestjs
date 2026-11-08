import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

function getAllTsFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllTsFiles(fullPath, fileList);
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.ts') &&
      !entry.name.endsWith('.spec.ts') &&
      !entry.name.endsWith('.e2e-spec.ts')
    ) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function extractImportSpecifiers(content: string): Array<{ line: number; raw: string; specifier: string }> {
  const results: Array<{ line: number; raw: string; specifier: string }> = [];
  const lines = content.split('\n');
  const fromRegex = /\bfrom\s+['"]([^'"]+)['"]/;

  lines.forEach((lineText, idx) => {
    const trimmed = lineText.trim();
    if (
      (trimmed.startsWith('import ') || trimmed.startsWith('export ')) &&
      !trimmed.startsWith('//')
    ) {
      const match = fromRegex.exec(trimmed);
      if (match && match[1]) {
        results.push({
          line: idx + 1,
          raw: trimmed,
          specifier: match[1],
        });
      }
    }
  });

  return results;
}

describe('Architecture & Hexagonal Boundaries', () => {
  const srcDir = path.resolve(__dirname, '../src');

  it('domain layer must ONLY import from pure domain paths or allowed Node built-ins (no external libraries like xstate, @nestjs, @prisma, etc.)', () => {
    const allFiles = getAllTsFiles(srcDir);
    const domainFiles = allFiles.filter((f) => f.includes(`${path.sep}domain${path.sep}`));

    const allowedDomainImportPatterns = [
      /^\.\.?\//, // Relative paths within module
      /^@\/shared\/domain\//,
      /^@\/modules\/[^/]+\/domain\//,
      /^node:crypto$/,
      /^crypto$/,
    ];

    const forbiddenRelativeLayerPatterns = [
      /\/application\//,
      /\/infrastructure\//,
    ];

    const violations: string[] = [];

    for (const file of domainFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const imports = extractImportSpecifiers(content);

      for (const imp of imports) {
        const isAllowedSource = allowedDomainImportPatterns.some((pattern) =>
          pattern.test(imp.specifier),
        );
        const PointsToForbiddenLayer = forbiddenRelativeLayerPatterns.some((pattern) =>
          pattern.test(imp.specifier),
        );

        if (!isAllowedSource || PointsToForbiddenLayer) {
          violations.push(
            `${path.relative(srcDir, file)}:${imp.line} imports forbidden dependency "${imp.specifier}": "${imp.raw}"`,
          );
        }
      }
    }

    expect(
      violations,
      `Domain layer must be 100% pure TypeScript with zero external libraries:\n${violations.join('\n')}`,
    ).toEqual([]);
  });

  it('application layer must NOT import from infrastructure, persistence, or forbidden @nestjs packages', () => {
    const allFiles = getAllTsFiles(srcDir);
    const applicationFiles = allFiles.filter((f) => f.includes(`${path.sep}application${path.sep}`));

    const forbiddenPatterns = [
      /@prisma\//,
      /generated\/prisma/,
      /infrastructure/,
      /@nestjs\/(?!cqrs)/,
      /'xstate'/,
      /"xstate"/,
    ];

    const violations: string[] = [];

    for (const file of applicationFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('import ') || trimmed.startsWith('export * from')) {
          for (const pattern of forbiddenPatterns) {
            if (pattern.test(trimmed)) {
              violations.push(
                `${path.relative(srcDir, file)}:${index + 1} imports forbidden pattern ${pattern.toString()}: "${trimmed}"`,
              );
            }
          }
        }
      });
    }

    expect(violations, `Violations in application layer:\n${violations.join('\n')}`).toEqual([]);
  });

  it('shared layer must NOT import from feature modules', () => {
    const allFiles = getAllTsFiles(srcDir);
    const sharedFiles = allFiles.filter((f) => f.includes(`${path.sep}shared${path.sep}`));

    const forbiddenPatterns = [
      /@\/modules\//,
      /\.\.\/.*modules\//,
      /src\/modules\//,
    ];

    const violations: string[] = [];

    for (const file of sharedFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('import ') || trimmed.startsWith('export * from')) {
          for (const pattern of forbiddenPatterns) {
            if (pattern.test(trimmed)) {
              violations.push(
                `${path.relative(srcDir, file)}:${index + 1} imports forbidden pattern ${pattern.toString()}: "${trimmed}"`,
              );
            }
          }
        }
      });
    }

    expect(violations, `Violations in shared layer:\n${violations.join('\n')}`).toEqual([]);
  });

  it('repositories must NOT call $transaction directly on prisma', () => {
    const allFiles = getAllTsFiles(srcDir);
    const repoFiles = allFiles.filter(
      (f) =>
        f.includes(`${path.sep}infrastructure${path.sep}`) &&
        f.toLowerCase().includes('repository'),
    );

    const violations: string[] = [];

    for (const file of repoFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (line.includes('$transaction(')) {
          violations.push(
            `${path.relative(srcDir, file)}:${index + 1} calls $transaction directly: "${line.trim()}"`,
          );
        }
      });
    }

    expect(
      violations,
      `Repositories must rely on @Transactional() decorator and must NOT call $transaction directly:\n${violations.join('\n')}`,
    ).toEqual([]);
  });

  it('no layer (domain, application, infrastructure) may use forced type assertions ("as Type")', () => {
    const allFiles = getAllTsFiles(srcDir);
    const violations: string[] = [];
    const typeAssertionRegex = /\bas\s+(?!const\b)[A-Za-z_$][\w$.<>[\]]*/;

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const trimmed = line.trim();
        // Ignore comments and ES module import/export aliases
        if (
          trimmed.startsWith('//') ||
          trimmed.startsWith('*') ||
          trimmed.startsWith('/*') ||
          trimmed.startsWith('import ') ||
          trimmed.startsWith('export ')
        ) {
          return;
        }
        // Strip inline comments and string literals before checking
        const withoutComments = trimmed.replace(/\/\/.*$/, '');
        const withoutStrings = withoutComments
          .replace(/'[^']*'/g, "''")
          .replace(/"[^"]*"/g, '""')
          .replace(/`[^`]*`/g, '``');

        if (typeAssertionRegex.test(withoutStrings)) {
          violations.push(
            `${path.relative(srcDir, file)}:${index + 1} uses forbidden type assertion "as": "${trimmed}"`,
          );
        }
      });
    }

    expect(
      violations,
      `Type assertions ("as Type") are forbidden across all layers. Use Type Guards, instanceof, or parseState() instead:\n${violations.join('\n')}`,
    ).toEqual([]);
  });
});
