import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import router from './routes/index.js'
import { errorHandler } from './middlewares/error.middleware.js'

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.use('/api/v1', router)

app.use(errorHandler)

export default app