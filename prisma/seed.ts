import { ensureDatabaseSeeded } from '../src/lib/dbSeeder';

async function main() {
  console.log('Seeding SQLite database...');
  const result = await ensureDatabaseSeeded(true);
  console.log('Result:', result);
  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  console.error('Seed script error:', err);
  process.exit(1);
});
