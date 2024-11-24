import { z } from 'zod'
import { needsHumanApproval } from '../../../lib'

export const buy = {
  config: {
    name: 'buy',
    parameters: z.object({
      sku: z.string(),
      quantity: z.number(),
      name: z.string(),
    }),
    description: 'Buy a specific item',
  },
  tool: needsHumanApproval<z.infer<typeof buy.config.parameters>>(
    {
      user: '1345',
      actionId: 'buy',
      title: 'Buy Item',
      approvers: [{ name: 'Scott Moss', email: 'scott@superfilter.ai' }],
      type: 'async',
      syncTimeout: 30000,
      autoApprove: async (args) => {
        return args.quantity > 10
      },
      links: (args) => [
        {
          label: 'View Item',
          url: `https://superfilter.ai/item/${args.sku}`,
        },
        {
          label: 'View Cart',
          url: 'https://superfilter.ai/cart',
        },
      ],
      shouldSeekApprovals: async (args) => true,
      ask: (args) =>
        `Scott wants to buy ${args.quantity} ${args.name}(s). Do you approve?`,
      approvalArguments: (args) => ({
        sku: {
          editable: false,
          type: 'string',
          value: args.sku,
          label: 'SKU',
        },
        name: {
          editable: false,
          type: 'string',
          value: args.name,
          label: 'Name',
        },
        quantity: {
          editable: true,
          type: 'number',
          value: args.quantity,
          label: 'Quantity',
        },
      }),
    },
    async (toolArguments) => {
      return {
        success: true,
        message: `Item ${toolArguments.sku} purchased successfully`,
      }
    }
  ),
}

export const readDB = {
  config: {
    name: 'readDB',
    parameters: z.object({
      dbTables: z.array(z.string()).describe('The tables to read from'),
    }),
    description: 'Read the production database to answer questions about data',
  },
  tool: needsHumanApproval<z.infer<typeof readDB.config.parameters>>(
    {
      user: '1345',
      actionId: 'readDB',
      title: 'Read Database',
      ask: (args) =>
        `Do you authorize me to read the following tables for Scott: ${args.dbTables.join(
          ', '
        )}?`,
      approvalArguments: (args) => ({
        dbTables: {
          editable: false,
          type: 'string',
          value: args.dbTables.join(', '),
          label: 'Tables',
        },
      }),
      type: 'sync',
      approvers: [{ name: 'Scott Moss', email: 'scott@superfilter.ai' }],
      syncTimeout: 10000,
    },
    async (toolArguments: z.infer<typeof readDB.config.parameters>) => {
      return {
        success: true,
        message: `Data for ${toolArguments.dbTables.join(', ')}`,
      }
    }
  ),
}

export const listProducts = {
  config: {
    name: 'listProducts',
    parameters: z.object({
      description: z.string(),
    }),
    description: 'List and search all products for sale',
  },
  tool: async (
    toolArguments: z.infer<typeof listProducts.config.parameters>
  ) => {
    return [
      {
        sku: '123',
        description: 'A fancy red shirt',
        name: 'shirt',
        price: 100,
      },
      {
        sku: '456',
        description: 'A blue pair of pants',
        name: 'pants',
        price: 250,
      },
      {
        sku: '789',
        description: 'A green hat',
        name: 'hat',
        price: 60,
      },
    ]
  },
}

export const executeTool = async (
  toolName: string,
  toolArguments:
    | z.infer<typeof buy.config.parameters>
    | z.infer<typeof listProducts.config.parameters>
    | z.infer<typeof readDB.config.parameters>
) => {
  switch (toolName) {
    case 'buy':
      return buy.tool(toolArguments)
    case 'listProducts':
      return listProducts.tool(toolArguments)
    case 'readDB':
      return readDB.tool(toolArguments)
    default:
      throw new Error(`Tool ${toolName} not found`)
  }
}
