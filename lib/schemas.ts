import { z } from 'zod'

export const InterventionFieldsSchema = z.record(
  z.string(),
  z.object({
    editable: z.boolean(),
    type: z.enum(['string', 'date', 'number', 'boolean', 'longString']),
    value: z.union([z.string(), z.number(), z.boolean(), z.date()]),
    label: z.string(),
  })
)

export const ApproverSchema = z.object({
  name: z.string(),
  email: z.string(),
  id: z.union([z.string(), z.number()]).optional(),
})

export const InterventionUISchema = z.object({
  title: z.string().optional(),
  ask: z.union([z.string(), z.function()]).optional(),
  fields: z.union([InterventionFieldsSchema, z.function()]).optional(),
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

const BaseInterventionSchema = z.strictObject({
  actionId: z.string(),
  userId: z.union([z.string(), z.number()]).optional(),
  orgId: z.union([z.string(), z.number()]).optional(),
  expiresAt: z.date().optional(),
  expiresIn: z.number().optional(),
  callbackUrl: z.string().optional(),
  ui: InterventionUISchema,
  approvers: z.array(ApproverSchema),
})

export const ApprovalInterventionSchema = BaseInterventionSchema.extend({
  type: z.literal('approval'),
})

export const SelectInterventionSchema = BaseInterventionSchema.extend({
  type: z.literal('select'),
  selectMode: z.enum(['single', 'multiple']).default('single'),
  selectOptions: z.record(
    z.string(),
    z.strictObject({
      value: z.union([z.string(), z.number(), z.boolean()]),
      description: z.string().optional(),
      name: z.string(),
      imageUrl: z.string().optional(),
      metadata: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional(),
    })
  ),
})

export const AnswerInterventionSchema = BaseInterventionSchema.extend({
  type: z.literal('answer'),
})

export const ValidateInterventionSchema = BaseInterventionSchema.extend({
  type: z.literal('validate'),
})

export const NewInterventionOptionsSchema = z.discriminatedUnion('type', [
  ApprovalInterventionSchema,
  SelectInterventionSchema,
  AnswerInterventionSchema,
  ValidateInterventionSchema,
])

const SafeToolExtension = z.object({
  mode: z.enum(['async', 'sync']).optional().default('async'),
  syncTimeout: z.number().optional().default(10000),
  skip: z.union([z.boolean(), z.function()]).optional().default(false),
})

export const CreateSafeToolOptionsSchema =
  NewInterventionOptionsSchema.and(SafeToolExtension)
