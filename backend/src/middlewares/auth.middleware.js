import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import AppError from '../shared/errors/AppError.js'


export const protect = (req, res, next) => {
     try{
     const authHeader=req.headers.authorization
     if(!authHeader || !authHeader.startsWith('Bearer ')){
        return next(new AppError('Unauthorized access', 401))
     }
      const token=authHeader.split(' ')[1]
       const decode=jwt.verify(token,env.JWT_SECRET)
         req.user=decode
            next()
     }catch(error){
       return next(new AppError('Invalid or expired token', 401))
     }
}