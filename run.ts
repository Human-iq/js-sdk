import { Humaniq } from './lib/index'

const humaniq = new Humaniq({
  baseUrl: 'http://localhost:3000',
  apiKey: '1091b7f1.BFC41ARATvdIMFmsySDwfy3DiUEXPBqT',
})

await humaniq.interventions.new()
