import fs from 'fs';
import path from 'path';

export function toCamelCase(str: string): string {
  if (!str) return str;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function getTableAliases(tableName: string): string[] {
  const camel = toCamelCase(tableName);
  const aliases = new Set<string>([tableName, camel]);
  if (!camel.endsWith('s')) {
    aliases.add(camel + 's');
    if (camel.endsWith('ch') || camel.endsWith('sh') || camel.endsWith('x')) {
      aliases.add(camel + 'es');
    }
  }
  return Array.from(aliases);
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getDatabaseFilePath(): string {
  return path.join(process.cwd(), 'prisma', 'dev.db');
}

export function getBackupsDirectory(): string {
  const dir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function sqlVal(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'bigint') return val.toString();
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (Buffer.isBuffer(val)) {
    return `E'\\\\x${val.toString('hex')}'`;
  }
  if (typeof val === 'object') {
    const jsonStr = JSON.stringify(val);
    return `'${jsonStr.replace(/'/g, "''")}'`;
  }
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

export function generateTimestampString(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}
