import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// One-time production bootstrap: creates (or resets the password of) the
// Father/Owner admin login. `prisma/seed.ts` refuses to run against
// production on purpose (it also plants sample farmers/buyers/etc., which
// production should never get) — but that means a freshly migrated
// production database has zero users and nobody can ever log in. This
// script fills exactly that one gap: a single ADMIN user, nothing else.
//
// Usage (run once, from the `backend` directory, with production
// DATABASE_URL in the environment):
//   ADMIN_EMAIL=owner@agribusiness.local ADMIN_PASSWORD='a-strong-password' npm run create-admin
//
// Both env vars are optional — omitted, they default to the same
// credentials as the dev seed (owner@agribusiness.local / ChangeMe123!).
// Change the password immediately after first login if you use the default.

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'owner@agribusiness.local').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'ADMIN', isActive: true },
    create: {
      name: 'Business Owner',
      email,
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`Admin user ready: ${user.email} (role: ${user.role})`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log('Using the default password ChangeMe123! — change it after logging in.');
  }
}

main()
  .catch((error) => {
    console.error('create-admin failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
