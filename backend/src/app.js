import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import router from './routes/index.js'
import { errorHandler } from './middlewares/error.middleware.js'
import {env} from "./config/env.js"

const app = express();
app.get("/", (req,res) => {
   res.send("DentaCare Backend Running");
})

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}))

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.use('/api/v1', router)

app.use(errorHandler)

export default app