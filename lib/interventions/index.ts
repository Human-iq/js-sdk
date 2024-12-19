import type {
  ApprovalRequestOptions,
  CreateSafeToolOptions,
  HumaniqOptions,
} from '../types'
import { z } from 'zod'
import { fetcher } from '../fetch'
import {
  ApprovalInterventionSchema,
  CreateSafeToolOptionsSchema,
  NewInterventionOptionsSchema,
} from 'lib/schemas'

const API_PATH = '/interventions'

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

  async new(
    options: z.infer<typeof ApprovalInterventionSchema>
  ): Promise<{ intervention: any; approvers: any[] }> {
    try {
      const validatedOptions = NewInterventionOptionsSchema.parse(options)
      const data = await fetcher({
        baseUrl: this.baseUrl,
        path: API_PATH,
        method: 'POST',
        body: validatedOptions,
        apiKey: this.options.apiKey,
      })
      return data.data
    } catch (error) {
      console.error('Failed to create approval request:', error)
      throw error
    }
  }

  createSafeTool<T = any>(
    options: CreateSafeToolOptions<T>,
    tool?: (toolArguments: T) => void | Promise<any>
  ) {
    let finalOptions

    try {
      finalOptions = CreateSafeToolOptionsSchema.parse(options)
    } catch (error: any) {
      throw new Error(`Invalid options: ${error.message}`)
    }

    return async (toolArguments: T) => {
      const {
        mode = 'async',
        syncTimeout,
        skip,
        ...interventionOptions
      } = finalOptions

      if (mode === 'sync' && !tool) {
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

      const ask =
        typeof interventionOptions.ui?.ask === 'function'
          ? (interventionOptions.ui.ask(toolArguments) as string)
          : interventionOptions.ui?.ask

      if (!ask) {
        throw new Error('You must supply an [ask] field.')
      }

      const links =
        typeof interventionOptions.ui?.links === 'function'
          ? (interventionOptions.ui.links(toolArguments) as {
              label: string
              url: string
            }[])
          : interventionOptions.ui?.links || []

      const fields =
        typeof interventionOptions.ui?.fields === 'function'
          ? interventionOptions.ui.fields(toolArguments)
          : interventionOptions.ui?.fields

      const requestOptions = {
        ...interventionOptions,
        ui: {
          ...interventionOptions.ui,
          ask,
          fields,
          links,
        },
        type: interventionOptions.type || 'approval',
        approvers: interventionOptions.approvers || [],
      }

      if (mode === 'sync') {
        const result = await this.new(requestOptions as any)

        const timeout = syncTimeout || 20000 // Default 20 seconds
        const startTime = Date.now()

        while (Date.now() - startTime < timeout) {
          const { status } = await this.get(result.intervention.id)

          if (status === 'approved') {
            if (tool) {
              return tool(toolArguments)
            }
          }

          if (status === 'rejected') {
            return {
              interventionId: result.intervention.id,
              status: 'rejected',
              approvalRequest: 'Rejected',
              approvers: result.approvers,
              messageToUser:
                'Let the user know that the approval request to perform this job was denied.',
            }
          }

          // Wait 1 second between polls
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        await this.update(result.intervention.id, 'expired')
        return {
          interventionId: result.intervention.id,
          status: 'expired',
          approvalRequest: 'Expired',
          approvers: result.approvers,
          messageToUser:
            'Let the user know that the approval request to perform this job was not approved in time so there for you could not complete the job.',
        }
      } else {
        const result = await this.new(requestOptions as any)
        return {
          interventionId: result.intervention.id,
          status: 'pending',
          approvalRequest: 'Pending',
          approvers: result.approvers,
        }
      }
    }
  }
}
