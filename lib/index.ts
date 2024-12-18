import { Dashboard } from './dashboard'
import { Interventions } from './interventions'
import type { HumaniqOptions } from './types'

const defaultOptions: HumaniqOptions = {
  baseUrl: 'https://api.humaniq.dev',
  apiVersion: 'v1',
  apiKey: process.env.HUMANIQ_API_KEY,
}

export class Humaniq {
  public interventions: Interventions
  public dashboard: Dashboard
  private options: Required<HumaniqOptions>

  constructor(options?: HumaniqOptions) {
    this.options = {
      ...defaultOptions,
      ...(options || {}),
    } as Required<HumaniqOptions>

    this.interventions = new Interventions(this.options)
    this.dashboard = new Dashboard(this.options)
  }
}
