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

export const CreateUserInput = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: RoleSchema,
});
export type CreateUserInput = z.infer<typeof CreateUserInput>;

export const UpdateUserInput = z.object({
  name: z.string().min(1).optional(),
  role: RoleSchema.optional(),
  active: z.boolean().optional(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserInput>;

export const PdvInput = z.object({
  name: z.string().min(1),
  document: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radiusM: z.number().int().min(10).optional(),
  active: z.boolean().optional(),
});
export type PdvInput = z.infer<typeof PdvInput>;

export const PdvDto = z.object({
  id: z.string(),
  name: z.string(),
  document: z.string().nullable(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  radiusM: z.number(),
  active: z.boolean(),
});
export type PdvDto = z.infer<typeof PdvDto>;

export const WalletItemDto = PdvDto.pick({
  id: true,
  name: true,
  address: true,
  latitude: true,
  longitude: true,
  radiusM: true,
});
export type WalletItemDto = z.infer<typeof WalletItemDto>;

export const AssignPdvInput = z.object({
  pdvId: z.string().min(1),
});
export type AssignPdvInput = z.infer<typeof AssignPdvInput>;

export const AdminUserDto = UserDto.extend({
  googleId: z.string().nullable(),
});
export type AdminUserDto = z.infer<typeof AdminUserDto>;
