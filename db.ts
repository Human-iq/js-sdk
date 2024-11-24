import { JSONFilePreset } from 'lowdb/node'

// Generic type for demo schemas
export type DemoSchema<T> = {
  [key: string]: T
}

// Initialize database with default data for a specific demo
export const initializeDB = async <T>(demoName: string, defaultData: T) => {
  // Create schema with demo name as key
  const schema = {
    [demoName]: defaultData,
  }

  // Initialize lowdb with file and schema
  const db = await JSONFilePreset<DemoSchema<T>>('db.json', schema)

  return {
    // Get data for this demo
    getData: () => db.data[demoName],

    // Update data for this demo
    setData: async (newData: T) => {
      db.data[demoName] = newData
      await db.write()
    },

    // Write changes to disk
    write: async () => {
      await db.write()
    },
  }
}
