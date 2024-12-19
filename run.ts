import { Humaniq } from './lib/index'

const humaniq = new Humaniq({
  baseUrl: 'http://localhost:3000',
  apiKey: 'bbbfc4f6.RTsiru9s0liMGmK8QOHlQR5WNgeejB',
})

type SendEmailArgs = { body: string; to: string; from: string; subject: string }

const sendEmail = async (args: SendEmailArgs) => {
  // sends an email
}

const sendEmailWithApproval =
  humaniq.interventions.createSafeTool<SendEmailArgs>(
    {
      actionId: 'sendEmail',
      approvers: [{ email: 'scott@humaniq.dev', name: 'Scott', id: '1' }],
      // expiresAt: '',
      // expiresIn: 2323
      userId: '3948fsadf8934n',
      orgId: 'org-3847fhasd9fu',
      ui: {
        title: 'Send Email',
        links: [],
        ask: (args) => {
          return `Send email to ${args.to}?`
        },
        fields: (args) => ({
          subject: {
            label: 'Subject',
            type: 'string',
            editable: false,
            value: args.to,
          },
        }),
      },
    },
    sendEmail
  )

sendEmailWithApproval({
  to: 'john@doe.com',
  from: 'signedinuser@gmail.com',
  subject: 'hello',
  body: 'hello',
})

//
