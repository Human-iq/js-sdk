import express from 'express'

const app = express()

// Parse JSON payloads
app.use(express.json())

// Webhook endpoint
app.post('/handle/approval', (req: any, res: any) => {
  try {
    // Log webhook payload
    console.log('Received webhook:', req.body)

    // Send success response
    res.status(200).send('Webhook received successfully')
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).send('Error processing webhook')
  }
})

app.post('/handle/reject', (req: any, res: any) => {
  try {
    // Log webhook payload
    console.log('Received reject:', req.body)

    // Send success response
    res.status(200).send('Rejected')
  } catch (error) {
    console.error('Error processing reject:', error)
    res.status(500).send('Error processing reject')
  }
})

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
