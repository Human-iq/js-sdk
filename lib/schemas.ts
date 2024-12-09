import { z } from 'zod'

export const CreateSafeToolOptionsSchema = z.object({
  type: z.enum(['async', 'sync']).optional().default('async'),
  syncTimeout: z.number().optional().default(10000),
  skip: z.union([z.boolean(), z.function()]).optional().default(false),
  actionId: z.string(),
  userId: z.union([z.string(), z.number()]).optional(),
  orgId: z.union([z.string(), z.number()]).optional(),
  expiresAt: z.date().optional(),
  expiresIn: z.number().optional(),
  onApprovedCallbackUrl: z.string().optional(),
  onRejectedCallbackUrl: z.string().optional(),
  onExpiredCallbackUrl: z.string().optional(),
  ui: z
    .object({
      title: z.string().optional(),
      ask: z.union([z.string(), z.function()]).optional(),
      fields: z
        .union([
          z.record(
            z.object({
              editable: z.boolean(),
              type: z.enum([
                'string',
                'date',
                'number',
                'boolean',
                'longString',
              ]),
              value: z.union([z.string(), z.number(), z.boolean(), z.date()]),
              label: z.string(),
            })
          ),
          z.function(),
        ])
        .optional(),
      links: z
        .union([
          z.array(
            z.object({
              label: z.string(),
              url: z.string(),
            })
          ),
          z.function(),
        ])
        .optional(),
    })
    .optional(),
  approvers: z
    .array(
      z.object({
        name: z.string(),
        id: z.union([z.string(), z.number()]).optional(),
        email: z.string(),
      })
    )
    .optional(),
})
