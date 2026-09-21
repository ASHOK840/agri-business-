import { z } from 'zod';

// This is the entire account-provisioning surface for Staff and
// Transportation logins — there is no public signup anywhere in the app.
// Role is deliberately restricted to STAFF/TRANSPORTATION: creating
// another ADMIN account is not exposed through this screen.
export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(200, 'Name is too long.'),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid username/email.'),

  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .max(100, 'Password is too long.'),

  role: z.enum(['STAFF', 'TRANSPORTATION'], {
    message: 'Role must be Staff or Transportation.',
  }),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean({ message: 'isActive must be true or false.' }),
});

export const resetUserPasswordSchema = z.object({
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .max(100, 'Password is too long.'),
});

export const listUsersQuerySchema = z.object({
  role: z.enum(['ADMIN', 'STAFF', 'TRANSPORTATION']).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
