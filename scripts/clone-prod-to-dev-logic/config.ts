import fs from 'fs';
import path from 'path';
import readline from 'readline';
import dotenv from 'dotenv';

export interface ResolvedDatabaseUrls {
  prodUrl: string;
  devUrl: string;
  prodSource: string;
  devSource: string;
}

// Helper đọc file env
export function readEnvFile(filename: string): Record<string, string> {
  const filePath = path.join(process.cwd(), filename);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    return dotenv.parse(content);
  }
  return {};
}

// Lấy database URL cho PROD và DEV
export function resolveDatabaseUrls(): ResolvedDatabaseUrls {
  const args = process.argv.slice(2);
  let prodUrl = '';
  let devUrl = '';
  let prodSource = '';
  let devSource = '';

  // 1. Kiểm tra tham số CLI: --prod=... hoặc --dev=...
  for (const arg of args) {
    if (arg.startsWith('--prod=') || arg.startsWith('--source=')) {
      prodUrl = arg.split('=')[1]?.replace(/^["']|["']$/g, '');
      prodSource = 'CLI argument (--prod)';
    }
    if (arg.startsWith('--dev=') || arg.startsWith('--target=')) {
      devUrl = arg.split('=')[1]?.replace(/^["']|["']$/g, '');
      devSource = 'CLI argument (--dev)';
    }
  }

  // 2. Kiểm tra biến môi trường hệ thống
  if (!prodUrl) {
    prodUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL_PROD || '';
    if (prodUrl) prodSource = 'Environment variable (PROD_DATABASE_URL)';
  }
  if (!devUrl) {
    devUrl = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL_DEV || '';
    if (devUrl) devSource = 'Environment variable (DEV_DATABASE_URL)';
  }

  // 3. Đọc từ file .env.prod và .env.dev
  const envProd = readEnvFile('.env.prod');
  const envDev = readEnvFile('.env.dev');

  if (!prodUrl && envProd.DATABASE_URL) {
    prodUrl = envProd.DATABASE_URL;
    prodSource = 'File .env.prod';
  }
  if (!devUrl && envDev.DATABASE_URL) {
    devUrl = envDev.DATABASE_URL;
    devSource = 'File .env.dev';
  }

  // 4. Fallback đọc từ .env mặc định nếu có DATABASE_URL
  const envDefault = readEnvFile('.env');
  if (!prodUrl && envDefault.PROD_DATABASE_URL) {
    prodUrl = envDefault.PROD_DATABASE_URL;
    prodSource = 'File .env (PROD_DATABASE_URL)';
  }
  if (!devUrl && envDefault.DEV_DATABASE_URL) {
    devUrl = envDefault.DEV_DATABASE_URL;
    devSource = 'File .env (DEV_DATABASE_URL)';
  }

  return { prodUrl, devUrl, prodSource, devSource };
}

// Ẩn mật khẩu trong connection string để hiển thị an toàn trên console
export function maskDbUrl(url: string): string {
  try {
    return url.replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1******$3');
  } catch {
    return url.substring(0, 15) + '...';
  }
}

// Xác nhận từ người dùng nếu chưa truyền --force hoặc --yes
export async function confirmPrompt(message: string): Promise<boolean> {
  const args = process.argv.slice(2);
  if (args.includes('--force') || args.includes('-f') || args.includes('--yes') || args.includes('-y')) {
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      resolve(trimmed === 'y' || trimmed === 'yes' || trimmed === 'đồng ý' || trimmed === 'dong y');
    });
  });
}

// Kiểm tra cấu hình URL và in thông tin kết nối an toàn
export function validateAndLogDatabaseUrls({ prodUrl, devUrl, prodSource, devSource }: ResolvedDatabaseUrls): void {
  // 1. Kiểm tra cấu hình URL
  if (!prodUrl) {
    console.error('\n❌ [LỖI] Không tìm thấy URL Database PROD!');
    console.error('👉 Vui lòng kiểm tra:');
    console.error('   1. Tạo file .env.prod chứa: DATABASE_URL="postgres://..."');
    console.error('   2. Hoặc truyền tham số: --prod="postgres://..."');
    console.error('   3. Hoặc gán biến môi trường PROD_DATABASE_URL\n');
    process.exit(1);
  }

  if (!devUrl) {
    console.error('\n❌ [LỖI] Không tìm thấy URL Database DEV!');
    console.error('👉 Vui lòng kiểm tra:');
    console.error('   1. Tạo file .env.dev chứa: DATABASE_URL="postgres://..."');
    console.error('   2. Hoặc truyền tham số: --dev="postgres://..."');
    console.error('   3. Hoặc gán biến môi trường DEV_DATABASE_URL\n');
    process.exit(1);
  }

  // 2. Bảo vệ an toàn: Kiểm tra tránh ghi đè nhầm nếu 2 URL giống nhau
  if (prodUrl.trim() === devUrl.trim()) {
    console.error('\n⛔ [NGUY HIỂM] Database PROD và DEV đang trỏ đến cùng 1 URL!');
    console.error(`URL: ${maskDbUrl(prodUrl)}`);
    console.error('❌ Thao tác bị huỷ để tránh mất mát dữ liệu. Vui lòng kiểm tra lại file .env.prod và .env.dev.\n');
    process.exit(1);
  }

  console.log('\n--- CẤU HÌNH KẾT NỐI ---');
  console.log(`🔹 NGUỒN (PROD): ${maskDbUrl(prodUrl)}`);
  console.log(`   └─ Nguồn cấu hình: ${prodSource}`);
  console.log(`🔸 ĐÍCH  (DEV) : ${maskDbUrl(devUrl)}`);
  console.log(`   └─ Nguồn cấu hình: ${devSource}`);
}
