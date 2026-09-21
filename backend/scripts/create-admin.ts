import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

// One-time production bootstrap: creates (or resets the password of) a
// login user. `prisma/seed.ts` refuses to run against production on
// purpose (it also plants sample farmers/buyers/etc., which production
// should never get) — but that means a freshly migrated production
// database has zero users and nobody can ever log in. This script fills
// exactly that gap: one user at a time, nothing else.
//
// Usage (run once per account, from the `backend` directory, with
// production DATABASE_URL in the environment):
//   ADMIN_EMAIL=owner@agribusiness.local ADMIN_PASSWORD='a-strong-password' npm run create-admin
//   ADMIN_EMAIL=transport@agribusiness.local ADMIN_PASSWORD='...' ADMIN_ROLE=TRANSPORTATION ADMIN_NAME='Transport Login' npm run create-admin
//   ADMIN_EMAIL=staff@agribusiness.local ADMIN_PASSWORD='...' ADMIN_ROLE=STAFF ADMIN_NAME='Staff Login' npm run create-admin
//
// ADMIN_EMAIL/ADMIN_PASSWORD are optional and default to the same admin
// credentials as the dev seed (owner@agribusiness.local / ChangeMe123!).
// ADMIN_ROLE defaults to ADMIN (must be ADMIN, STAFF, or TRANSPORTATION —
// see the UserRole enum in prisma/schema.prisma). Change the password
// immediately after first login if you use the default.

const VALID_ROLES = ['ADMIN', 'STAFF', 'TRANSPORTATION'];

const ROLE_DEFAULT_NAMES: Record<string, string> = {
  ADMIN: 'Business Owner',
  STAFF: 'Test Staff Login',
  TRANSPORTATION: 'Test Transportation Login',
};

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'owner@agribusiness.local').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const role = (process.env.ADMIN_ROLE || 'ADMIN').trim().toUpperCase();
  const name = process.env.ADMIN_NAME || ROLE_DEFAULT_NAMES[role] || 'User';

  if (!VALID_ROLES.includes(role)) {
    console.error(`ADMIN_ROLE must be one of ${VALID_ROLES.join(', ')} — got "${role}".`);
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: role as UserRole, isActive: true },
    create: {
      name,
      email,
      passwordHash,
      role: role as UserRole,
    },
  });

  console.log(`User ready: ${user.email} (role: ${user.role})`);
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
