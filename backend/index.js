import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from './Config/db.js'
import authRoutes from './Routes/authRoutes.js'
import eligibilityRoutes from './Routes/eligibilityRoutes.js'

dotenv.config()
connectDB()

const app = express()

const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000'
app.use(
  cors({
    origin: allowedOrigin,
    methods: ['POST', 'GET', 'PUT', 'DELETE'],
    credentials: true,
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.send('Server is running')
})

app.use('/api/auth', authRoutes)
app.use('/api/eligibility', eligibilityRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
})
