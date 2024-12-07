export type ApprovalArguments = Record<
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

export interface HumaniqOptions {
  baseUrl?: string
  apiKey?: string
  apiVersion?: string
}
