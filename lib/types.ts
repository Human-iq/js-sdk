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
  // the unique id of the action that needs an intervention
  actionId: string
  // the associated user id of the initiator
  userId?: string | number
  // optional org id of the initiator
  orgId?: string | number
  expiresAt?: Date
  expiresIn?: number
  approvers?: { name: string; email: string; id?: string | number }[]
  onApprovedCallbackUrl?: string
  onRejectedCallbackUrl?: string
  onExpiredCallbackUrl?: string
  ui?: {
    title?: string
    ask?: string | ((args: T) => string)
    fields?: ApprovalArguments | ((args: T) => ApprovalArguments)
    links?:
      | { label: string; url: string }[]
      | ((args: T) => { label: string; url: string }[])
  }
}

export type CreateSafeToolOptions<T = any> = ApprovalRequestOptions & {
  skip?: boolean | ((args: T) => Promise<boolean>)
  type?: 'async' | 'sync'
  syncTimeout?: number
}

export interface HumaniqOptions {
  baseUrl?: string
  apiKey?: string
  apiVersion?: string
}
