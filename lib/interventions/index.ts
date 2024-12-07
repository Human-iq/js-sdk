import type {
  ApprovalRequestOptions,
  CreateSafeToolOptions,
  HumaniqOptions,
} from '../../types'
import { z } from 'zod'
import { fetcher } from '../fetch'

const API_PATH = '/api/interventions'

export class Interventions {
  private baseUrl: string

  constructor(private readonly options: Required<HumaniqOptions>) {
    this.baseUrl = options.baseUrl
  }

  async update(
    interventionId: string,
    status: 'approved' | 'rejected' | 'expired'
  ) {
    try {
      await fetcher({
        baseUrl: this.baseUrl,
        path: `${API_PATH}/${interventionId}`,
        method: 'PATCH',
        body: { status },
        apiKey: this.options.apiKey,
      })
    } catch (error) {
      console.error('Failed to update approval request:', error)
      throw error
    }
  }

  async get(interventionId: string) {
    try {
      const data = await fetcher({
        baseUrl: this.baseUrl,
        path: `${API_PATH}/${interventionId}`,
        method: 'GET',
        apiKey: this.options.apiKey,
      })
      return data.approval
    } catch (error) {
      console.error('Failed to check approval status:', error)
      throw error
    }
  }

  async new(options: ApprovalRequestOptions) {
    try {
      const data = await fetcher({
        baseUrl: this.baseUrl,
        path: '${API_PATH}',
        method: 'POST',
        body: options,
        apiKey: this.options.apiKey,
      })
      return { interventionId: data.approval.id, url: data.approval.url }
    } catch (error) {
      console.error('Failed to create approval request:', error)
      throw error
    }
  }

  createSafeTool<T = any>(
    options: CreateSafeToolOptions<T>,
    tool?: (toolArguments: T) => void | Promise<any>
  ) {
    const createSafeToolSchema = z.object({
      type: z.enum(['async', 'sync']).optional().default('async'),
      syncTimeout: z.number().optional().default(10000),
      skip: z.union([z.boolean(), z.function()]).optional().default(false),
      actionId: z.string(),
      ui: z
        .object({
          title: z.string(),
          ask: z.union([z.string(), z.function()]),
          fields: z.union([z.record(z.any()), z.function()]),
          links: z.union([z.array(z.any()), z.function()]),
        })
        .optional()
        .default({
          title: 'Approval',
          ask: 'Do you approve?',
          fields: {},
          links: () => [],
        }),
      approvers: z
        .array(
          z.object({
            name: z.string(),
            id: z.union([z.string(), z.number()]),
            email: z.string(),
          })
        )
        .optional()
        .default([]),
    })

    let finalOptions

    try {
      finalOptions = createSafeToolSchema.parse(options)
    } catch (error: any) {
      throw new Error(`Invalid options: ${error.message}`)
    }

    return async (toolArguments: T) => {
      const {
        type = 'async',
        syncTimeout,
        skip,
        ...interventionOptions
      } = finalOptions

      if (type === 'sync' && !tool) {
        throw new Error('Tool is required for sync approvals')
      }

      if (skip !== undefined) {
        if (typeof skip === 'boolean') {
          if (skip && tool) {
            return tool(toolArguments)
          }
        }

        if (typeof skip === 'function') {
          const shouldSkip = await skip(toolArguments)
          if (shouldSkip && tool) {
            return tool(toolArguments)
          }
        }
      }

      const ask: string =
        typeof finalOptions.ui?.ask === 'function'
          ? (finalOptions.ui.ask(toolArguments) as string)
          : finalOptions.ui?.ask

      const links =
        typeof finalOptions.ui?.links === 'function'
          ? (finalOptions.ui.links(toolArguments) as any[])
          : finalOptions.ui?.links || []

      const fields =
        typeof finalOptions.ui?.fields === 'function'
          ? finalOptions.ui.fields(toolArguments)
          : finalOptions.ui?.fields

      const requestOptions: ApprovalRequestOptions = {
        ...finalOptions,
        ui: {
          ...finalOptions.ui,
          ask,
          fields,
          links,
        },
      }

      if (type === 'sync') {
        const result = await this.new(requestOptions)

        const timeout = syncTimeout || 20000 // Default 20 seconds
        const startTime = Date.now()

        while (Date.now() - startTime < timeout) {
          const { status } = await this.get(result.interventionId)

          if (status === 'approved') {
            if (tool) {
              return tool(toolArguments)
            }
          }

          if (status === 'rejected') {
            return {
              interventionId: result.interventionId,
              status: 'rejected',
              approvalRequest: 'Rejected',
              approvers: interventionOptions.approvers,
              messageToUser:
                'Let the user know that the approval request to perform this job was denied.',
            }
          }

          // Wait 1 second between polls
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        await this.update(result.interventionId, 'expired')
        return {
          interventionId: result.interventionId,
          status: 'expired',
          approvalRequest: 'Expired',
          approvers: interventionOptions.approvers,
          messageToUser:
            'Let the user know that the approval request to perform this job was not approved in time so there for you could not complete the job.',
        }
      } else {
        const result = await this.new(requestOptions)
        return {
          interventionId: result.interventionId,
          status: 'pending',
          approvalRequest: 'Pending',
          approvers: interventionOptions.approvers,
        }
      }
    }
  }
}
