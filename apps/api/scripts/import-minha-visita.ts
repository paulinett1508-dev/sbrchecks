import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();
const CSV_PATH = join(process.cwd(), 'import_MINHAVISITA', 'customers_6233780.csv');

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function main() {
  const raw = readFileSync(CSV_PATH, 'utf-8').replace(/^﻿/, '');
  const [headerLine, ...dataLines] = raw.split('\n').filter((l) => l.trim());
  const cols = headerLine.split(';').map((c) => c.trim());
  const nameIdx = cols.indexOf('Nome');
  const addrIdx = cols.indexOf('Endereco');

  const existingNames = new Set(
    (await prisma.pdv.findMany({ select: { name: true } })).map((p) => p.name)
  );

  const toCreate = dataLines
    .map((line) => {
      const fields = parseCsvLine(line);
      const name = fields[nameIdx]?.trim();
      const address = fields[addrIdx]?.trim() || null;
      return { name, address };
    })
    .filter((r): r is { name: string; address: string | null } =>
      Boolean(r.name) && !existingNames.has(r.name)
    );

  const existing = dataLines.length - toCreate.length;
  let created = 0;
  let errors = 0;

  const CHUNK = 200;
  for (let i = 0; i < toCreate.length; i += CHUNK) {
    const chunk = toCreate.slice(i, i + CHUNK);
    try {
      const result = await prisma.pdv.createMany({
        data: chunk.map(({ name, address }) => ({
          name,
          address,
          latitude: null,
          longitude: null,
          radiusM: 120,
          active: true,
        })),
        skipDuplicates: true,
      });
      created += result.count;
    } catch (e) {
      console.error(`Erro no chunk ${i}–${i + chunk.length}:`, e);
      errors += chunk.length;
    }
  }

  console.log(`✓ criados: ${created} | já existiam: ${existing} | erros: ${errors}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
