import { Humaniq } from './lib/index'

const humaniq = new Humaniq({
  baseUrl: 'http://localhost:3000',
  apiKey: '88e73399.7rpX3yE22aXIMLDwJoFRqwmPGb41vT5',
})

type SendEmailArgs = { body: string; to: string; from: string; subject: string }

const sendEmail = async (args: SendEmailArgs) => {
  // sends an email
}

const sendEmailWithApproval =
  humaniq.interventions.createSafeTool<SendEmailArgs>(
    {
      actionId: 'sendEmail',
      approvers: [
        { email: 'john@doe.com', name: 'John Jones', id: 934898457845749 },
      ],
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
