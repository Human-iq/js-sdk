import OpenAI from 'openai'
import { zodFunction } from 'openai/helpers/zod'
import readline from 'readline'
import chalk from 'chalk'
import { buy, executeTool, listProducts, readDB } from './tools'
import { initializeDB } from '../../../db'

// Types
type Message = OpenAI.Chat.ChatCompletionMessageParam
type Conversation = {
  id: string
  messages: Message[]
  createdAt: string
}

type DbSchema = {
  conversations: Conversation[]
}

// Database initialization
const defaultData: DbSchema = {
  conversations: [],
}

const tools = [
  zodFunction(buy.config),
  zodFunction(listProducts.config),
  zodFunction(readDB.config),
]

// Terminal interface setup
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

// Agent implementation
const runAgent = async (userInput: string, conversationId?: string) => {
  const db = await initializeDB('shopChat', defaultData)
  const openai = new OpenAI()

  let conversation: Conversation

  if (conversationId) {
    conversation = db
      .getData()
      .conversations.find((c) => c.id === conversationId) || {
      id: conversationId,
      messages: [],
      createdAt: new Date().toISOString(),
    }
  } else {
    conversationId = crypto.randomUUID()
    conversation = {
      id: conversationId,
      messages: [],
      createdAt: new Date().toISOString(),
    }
    const currentData = db.getData()
    await db.setData({
      conversations: [...(currentData?.conversations || []), conversation],
    })
  }

  if (conversation.messages.length === 0) {
    conversation.messages.push({
      role: 'system',
      content:
        'You are a helpful customer support assistant. Use the supplied tools to assist the user.',
    })
  }

  conversation.messages.push({
    role: 'user',
    content: userInput,
  })

  displayMessages(conversation.messages)
  await db.write()

  while (true) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: conversation.messages,
      tools,
    })

    const message = response.choices[0].message

    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        const functionCall = toolCall.function

        let functionResponse = await executeTool(
          functionCall.name,
          JSON.parse(functionCall.arguments)
        )

        if (typeof functionResponse !== 'string') {
          functionResponse = JSON.stringify(functionResponse)
        }

        conversation.messages.push(message)
        conversation.messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: functionResponse,
        })

        displayMessages([
          message,
          {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: functionResponse,
          },
        ])
        await db.write()
      }
      continue
    }

    conversation.messages.push(message)
    displayMessages([message])
    await db.write()

    return {
      response: message.content,
      conversationId,
      history: conversation.messages,
    }
  }
}

// UI Helper functions
const displayConversations = async () => {
  const db = await initializeDB('shopChat', defaultData)
  console.log(chalk.cyan('\nAvailable conversations:'))

  if (db.getData().conversations.length === 0) {
    console.log(chalk.yellow('No conversations found'))
    return
  }

  db.getData().conversations.forEach((conv) => {
    console.log(
      chalk.green(`ID: ${conv.id}`),
      chalk.gray(`(Created: ${new Date(conv.createdAt).toLocaleString()})`),
      chalk.yellow(`[${conv.messages.length} messages]`)
    )
  })
}

const displayMessages = (messages: Message[]) => {
  messages.forEach((msg) => {
    if (msg.role === 'user') {
      console.log(chalk.blue('\nUser: ') + msg.content)
    } else if (msg.role === 'assistant') {
      console.log(chalk.green('\nAssistant: ') + msg.content)
    } else if (msg.role === 'tool') {
      console.log(chalk.yellow('\nTool Response: ') + msg.content)
    }
  })
}

// Main chat interface
const startChat = async () => {
  while (true) {
    console.log(chalk.cyan('\n=== AI Chat Terminal ==='))
    console.log('1. Start new conversation')
    console.log('2. Continue existing conversation')
    console.log('3. List conversations')
    console.log('4. Exit')

    const choice = await question(chalk.yellow('\nChoose an option (1-4): '))

    if (choice === '4') {
      console.log(chalk.green('\nGoodbye!'))
      rl.close()
      process.exit(0)
    }

    if (choice === '3') {
      await displayConversations()
      continue
    }

    let conversationId: string | undefined

    if (choice === '2') {
      await displayConversations()
      conversationId = await question(chalk.yellow('\nEnter conversation ID: '))
    }

    console.log(
      chalk.cyan('\nStarting chat... (type "exit" to end conversation)')
    )

    while (true) {
      const userInput = await question(chalk.blue('\nYou: '))

      if (userInput.toLowerCase() === 'exit') {
        break
      }

      try {
        const result = await runAgent(userInput, conversationId)
        conversationId = result.conversationId
      } catch (error) {
        console.error(chalk.red('\nError: '), error)
        break
      }
    }
  }
}

// Start the application
export const main = async () => {
  try {
    await startChat()
  } catch (error) {
    console.error(chalk.red('Fatal error:'), error)
    rl.close()
    process.exit(1)
  }
}

main()
