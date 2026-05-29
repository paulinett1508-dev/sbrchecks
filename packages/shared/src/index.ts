import { z } from 'zod';

export const RoleSchema = z.enum(['GDD', 'GERENTE', 'ADMIN']);
export type Role = z.infer<typeof RoleSchema>;

export const GoogleAuthInput = z.object({
  accessToken: z.string().min(1),
});

export const UpdateRoleInput = z.object({
  role: RoleSchema,
});

export const UserDto = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: RoleSchema,
  active: z.boolean(),
});

export type UserDto = z.infer<typeof UserDto>;
