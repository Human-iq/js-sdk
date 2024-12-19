import type { HumaniqOptions } from '../types'
import { fetcher } from '../fetch'

const API_PATH = '/dashboard'

export class Dashboard {
  private baseUrl: string

  constructor(private readonly options: Required<HumaniqOptions>) {
    this.baseUrl = options.baseUrl
  }

  async getDashboardUrl(approverId: string): Promise<string> {
    try {
      const data = await fetcher({
        baseUrl: this.baseUrl,
        path: `${API_PATH}/${approverId}`,
        method: 'GET',
        apiKey: this.options.apiKey,
      })
      return data
    } catch (error) {
      console.error('Failed to get dashboard URL:', error)
      throw error
    }
  }
}
