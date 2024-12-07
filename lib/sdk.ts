import { Interventions } from 'lib/interventions'
import type { HumaniqOptions } from 'types'

const defaultOptions: HumaniqOptions = {
  baseUrl: 'https://api.humaniq.dev',
  apiVersion: 'v1',
  apiKey: process.env.HUMANIQ_API_KEY,
}

export class Humaniq {
  public interventions: Interventions
  private options: Required<HumaniqOptions>
  constructor(options?: HumaniqOptions) {
    this.options = {
      ...defaultOptions,
      ...(options || {}),
    } as Required<HumaniqOptions>
    this.interventions = new Interventions(this.options)
  }
}
