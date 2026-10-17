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
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe('Architecture & Hexagonal Boundaries', () => {
  const srcDir = path.resolve(__dirname, '../src');

  it('domain layer must NOT import from infrastructure, application, or frameworks', () => {
    const allFiles = getAllTsFiles(srcDir);
    const domainFiles = allFiles.filter((f) => f.includes(`${path.sep}domain${path.sep}`));

    const forbiddenPatterns = [
      /@nestjs\//,
      /@prisma\//,
      /generated\/prisma/,
      /class-validator/,
      /class-transformer/,
      /rxjs/,
      /express/,
      /infrastructure/,
      /application/,
    ];

    const violations: string[] = [];

    for (const file of domainFiles) {
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

    expect(violations, `Violations in domain layer:\n${violations.join('\n')}`).toEqual([]);
  });

  it('application layer must NOT import from infrastructure or persistence frameworks', () => {
    const allFiles = getAllTsFiles(srcDir);
    const applicationFiles = allFiles.filter((f) => f.includes(`${path.sep}application${path.sep}`));

    const forbiddenPatterns = [
      /@prisma\//,
      /generated\/prisma/,
      /infrastructure/,
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
});
