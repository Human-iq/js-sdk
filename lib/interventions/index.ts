import type { ApprovalRequestOptions, HumaniqOptions } from '../../types'

export class Interventions {
  private baseUrl: string

  constructor(private readonly options: Required<HumaniqOptions>) {
    this.baseUrl = options.baseUrl
  }

  async update(
    approvalRequestId: string,
    status: 'approved' | 'rejected' | 'expired'
  ) {
    try {
      await fetch(`${this.baseUrl}/api/approvals/${approvalRequestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify({ status }),
      })
    } catch (error) {
      console.error('Failed to update approval request:', error)
      throw error
    }
  }

  async get(approvalRequestId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/approvals/${approvalRequestId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.options.apiKey}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: any = await response.json()
      return data.approval
    } catch (error) {
      console.error('Failed to check approval status:', error)
      throw error
    }
  }

  async new(options: ApprovalRequestOptions) {
    try {
      const response = await fetch(`${this.baseUrl}/api/approvals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: any = await response.json()
      return { approvalRequestId: data.approval.id, url: data.approval.url }
    } catch (error) {
      console.error('Failed to create approval request:', error)
      throw error
    }
  }

  createSafeTool<T = any>(
    options: ApprovalRequestOptions<T> & {
      type?: 'async' | 'sync'
      syncTimeout?: number
    },
    tool?: (toolArguments: T) => Promise<any>
  ) {
    return async (toolArguments: T) => {
      const {
        type = 'async',
        syncTimeout,
        shouldSeekApprovals,
        ...approvalOptions
      } = options

      if (type === 'sync' && !tool) {
        throw new Error('Tool is required for sync approvals')
      }

      if (shouldSeekApprovals) {
        const seekApproval = await shouldSeekApprovals(toolArguments)
        if (!seekApproval) {
          return tool?.(toolArguments)
        }
      }

      const ask =
        typeof options.ask === 'function'
          ? options.ask(toolArguments)
          : options.ask

      const links =
        typeof options.links === 'function'
          ? options.links(toolArguments)
          : options.links

      const approvalArguments =
        typeof options.approvalArguments === 'function'
          ? options.approvalArguments(toolArguments)
          : options.approvalArguments

      const requestOptions: ApprovalRequestOptions = {
        ...approvalOptions,
        ask,
        approvalArguments,
        links: links as any,
      }

      if (type === 'sync') {
        const result = await this.new(requestOptions)

        const timeout = syncTimeout || 20000 // Default 20 seconds
        const startTime = Date.now()

        while (Date.now() - startTime < timeout) {
          const { status } = await this.get(result.approvalRequestId)

          if (status === 'approved') {
            if (tool) {
              return tool(toolArguments)
            }
          }

          if (status === 'rejected') {
            return {
              approvalRequestId: result.approvalRequestId,
              status: 'rejected',
              approvalRequest: 'Rejected',
              approvers: approvalOptions.approvers,
              messageToUser:
                'Let the user know that the approval request to perform this job was denied.',
            }
          }

          // Wait 1 second between polls
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        await this.update(result.approvalRequestId, 'expired')
        return {
          approvalRequestId: result.approvalRequestId,
          status: 'expired',
          approvalRequest: 'Expired',
          approvers: approvalOptions.approvers,
          messageToUser:
            'Let the user know that the approval request to perform this job was not approved in time so there for you could not complete the job.',
        }
      } else {
        const result = await this.new(requestOptions)
        return {
          approvalRequestId: result.approvalRequestId,
          status: 'pending',
          approvalRequest: 'Pending',
          approvers: approvalOptions.approvers,
        }
      }
    }
  }
}
