import { z } from "zod";

export const titlePresets = [
  "",
  "Mr.",
  "Mrs.",
  "Ms.",
  "Dr.",
  "Mr. & Mrs.",
  "Family",
] as const;
export const tokenSchema = z
  .string()
  .min(8)
  .max(128)
  .refine(
    (value) => !/[^A-Za-z0-9_-]/.test(value),
    "Use 8-128 letters, numbers, hyphens, or underscores.",
  );

export function normalizeCustomToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

const singleLineNameSchema = z
  .string()
  .refine(
    (value) => !/[\p{Cc}\p{Zl}\p{Zp}\u202A-\u202E\u2066-\u2069]/u.test(value),
    "Use a single-line name without control characters.",
  )
  .trim()
  .min(1, "Enter a name.")
  .max(160, "Names must be at most 160 characters.");

export const invitationInputSchema = z.object({
  guest_name: singleLineNameSchema,
  title: z.enum(titlePresets),
  display_name: singleLineNameSchema,
});

export const createInvitationSchema = invitationInputSchema
  .extend({
    token_mode: z.enum(["auto", "custom"]),
    custom_token: z.string().max(256).optional().default(""),
  })
  .superRefine((value, context) => {
    if (
      value.token_mode === "custom" &&
      !tokenSchema.safeParse(normalizeCustomToken(value.custom_token)).success
    ) {
      context.addIssue({
        code: "custom",
        path: ["custom_token"],
        message:
          "Custom links need 8-128 letters, numbers, hyphens, or underscores.",
      });
    }
  });

export const updateInvitationSchema = invitationInputSchema.extend({
  id: z.uuid(),
});
export const invitationIdSchema = z.uuid();
export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(1024),
});

export type InvitationInput = z.infer<typeof invitationInputSchema>;
