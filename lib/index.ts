type ApprovalArguments = Record<
  string,
  {
    editable: boolean
    type: 'string' | 'date' | 'number' | 'boolean' | 'longString'
    value: string | number | boolean | Date
    label: string
  }
>

export type ApprovalRequestOptions<T = any> = {
  user?: string
  actionId: string
  title?: string
  ask?: string | ((args: T) => string)
  approvalArguments?: ApprovalArguments | ((args: T) => ApprovalArguments)
  expiresAt?: Date
  expiresIn?: number
  approvers?: { name: string; email: string }[]
  onApprovedCallbackUrl?: string
  onRejectedCallbackUrl?: string
  onExpiredCallbackUrl?: string
  autoApprove?: (args: T) => Promise<boolean>
  shouldSeekApprovals?: (args: T) => Promise<boolean>
  links?: (
    args: T
  ) => { label: string; url: string }[] | { label: string; url: string }[]
}

export const updateApprovalRequest = async (
  approvalRequestId: string,
  status: 'approved' | 'rejected' | 'expired'
) => {
  try {
    await fetch(`http://localhost:3000/api/approvals/${approvalRequestId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })
  } catch (error) {
    console.error('Failed to update approval request:', error)
    throw error
  }
}

export const checkApprovalStatus = async (approvalRequestId: string) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/approvals/${approvalRequestId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: any = await response.json()
    return { status: data.approval.status }
  } catch (error) {
    console.error('Failed to check approval status:', error)
    throw error
  }
}

export const createApprovalRequest = async (
  options: ApprovalRequestOptions
) => {
  try {
    const response = await fetch('http://localhost:3000/api/approvals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

export const needsHumanApproval =
  <T = any>(
    options: ApprovalRequestOptions<T> & {
      type: 'async' | 'sync'
      syncTimeout?: number
    },
    tool?: (toolArguments: T) => Promise<any>
  ) =>
  async (toolArguments: T) => {
    const { type, syncTimeout, shouldSeekApprovals, ...approvalOptions } =
      options

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
      const result = await createApprovalRequest(requestOptions)

      const timeout = syncTimeout || 20000 // Default 20 seconds
      const startTime = Date.now()

      while (Date.now() - startTime < timeout) {
        const { status } = await checkApprovalStatus(result.approvalRequestId)

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

      await updateApprovalRequest(result.approvalRequestId, 'expired')
      return {
        approvalRequestId: result.approvalRequestId,
        status: 'expired',
        approvalRequest: 'Expired',
        approvers: approvalOptions.approvers,
        messageToUser:
          'Let the user know that the approval request to perform this job was not approved in time so there for you could not complete the job.',
      }
    } else {
      const result = await createApprovalRequest(requestOptions)
      return {
        approvalRequestId: result.approvalRequestId,
        status: 'pending',
        approvalRequest: 'Pending',
        approvers: approvalOptions.approvers,
      }
    }
  }

// export const needsHumanResponse = () => () => {}
