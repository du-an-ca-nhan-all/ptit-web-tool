import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Tài khoản phải có tối thiểu 3 ký tự')
    .max(50, 'Tài khoản không được vượt quá 50 ký tự')
    .transform((val) => val.trim().toUpperCase()),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Mã sinh viên phải có ít nhất 3 ký tự')
      .max(50, 'Mã sinh viên không được vượt quá 50 ký tự')
      .transform((val) => val.trim().toUpperCase()),
    password: z
      .string()
      .min(6, 'Mật khẩu phải có độ dài tối thiểu 6 ký tự để đảm bảo an toàn'),
    confirmPassword: z.string().optional(),
    phoneNumber: z
      .string()
      .trim()
      .max(20, 'Số điện thoại không hợp lệ')
      .optional()
      .nullable(),
    note: z
      .string()
      .trim()
      .max(500, 'Ghi chú không được vượt quá 500 ký tự')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.confirmPassword && data.password !== data.confirmPassword) {
        return false;
      }
      return true;
    },
    {
      message: 'Mật khẩu nhập lại không trùng khớp',
      path: ['confirmPassword'],
    }
  );

export type RegisterInput = z.infer<typeof registerSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z
      .string()
      .min(6, 'Mật khẩu mới phải có tối thiểu 6 ký tự'),
    confirmPassword: z
      .string()
      .min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu mới và xác nhận mật khẩu không khớp nhau',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const adminResetPasswordSchema = z.object({
  username: z
    .string()
    .min(3, 'Mã sinh viên phải có tối thiểu 3 ký tự')
    .transform((val) => val.trim().toUpperCase()),
  mode: z.enum(['CUSTOM', 'GENERATE', 'CLEAR']).default('CUSTOM'),
  newPassword: z.string().optional(),
});

export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;

export const impersonateSchema = z.object({
  targetUsername: z
    .string()
    .min(3, 'Mã sinh viên không hợp lệ')
    .transform((val) => val.trim().toUpperCase()),
});

export type ImpersonateInput = z.infer<typeof impersonateSchema>;

export type ValidationResult<T> =
  | { success: true; data: T; error?: never; fieldErrors?: never }
  | { success: false; error: string; fieldErrors: Record<string, string[] | undefined>; data?: never };

/**
 * Validate input with Zod and return standardized result
 */
export function validateZod<T>(
  schema: z.ZodType<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const fieldErrors = (result.error as any).flatten?.()?.fieldErrors || {};
  const firstError =
    result.error.issues?.[0]?.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';

  return {
    success: false,
    error: firstError,
    fieldErrors,
  };
}
