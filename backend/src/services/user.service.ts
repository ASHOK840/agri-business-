import bcrypt from 'bcrypt';
import prisma from '../config/prismaClient';
import { CreateUserInput, ListUsersQuery, ResetUserPasswordInput } from '../validators/user.validator';

export class DuplicateEmailError extends Error {
  constructor() {
    super('A user with this username/email already exists.');
    this.name = 'DuplicateEmailError';
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super('User not found.');
    this.name = 'UserNotFoundError';
  }
}

// Admin accounts are never created, deactivated, or password-reset from
// this screen — this is the Staff/Transportation account-management
// surface only, so an Admin can't accidentally lock themselves (or
// another Admin) out of the system here.
export class CannotModifyAdminError extends Error {
  constructor() {
    super('Admin accounts cannot be managed from this screen.');
    this.name = 'CannotModifyAdminError';
  }
}

// Never selects passwordHash — this is the one place User rows are read
// back to a client, and a password hash must never be part of that.
const safeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export const listUsers = async (query: ListUsersQuery) => {
  const where: Record<string, unknown> = {};
  if (query.role) where.role = query.role;

  return prisma.user.findMany({
    where,
    select: safeSelect,
    orderBy: { createdAt: 'desc' },
  });
};

export const createUser = async (input: CreateUserInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new DuplicateEmailError();
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    },
    select: safeSelect,
  });
};

const getManageableUserOrThrow = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new UserNotFoundError();
  }
  if (user.role === 'ADMIN') {
    throw new CannotModifyAdminError();
  }
  return user;
};

export const updateUserStatus = async (id: string, isActive: boolean) => {
  await getManageableUserOrThrow(id);
  return prisma.user.update({
    where: { id },
    data: { isActive },
    select: safeSelect,
  });
};

export const resetUserPassword = async (id: string, input: ResetUserPasswordInput) => {
  await getManageableUserOrThrow(id);
  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.user.update({
    where: { id },
    data: { passwordHash },
    select: safeSelect,
  });
};
