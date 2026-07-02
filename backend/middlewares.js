//here we find the middlewares for the backend server
require('dotenv').config() ;
const jwt = require('jsonwebtoken') ;
const rateLimit = require('express-rate-limit') ;
const protect = async(req , res , next) => {
    const accessToken = req.cookies.accessToken ;
    if (!accessToken){
        return res.status(401).json({error:"unauthorized!"}) ;
    }

    try{
        const decoded = jwt.verify(accessToken , process.env.JWT_SECRET) ;
        req.user = {id:decoded.userId , role:decoded.role} ;
        next() ;
    }catch(e){
        return res.status(401).json({error:"unauthorized!"}) ;
    }
}

//for checking roles 
const authorize = (...roles) => {
    return (req , res , next) => {
        if (!roles.includes(req.user.role)){
            return res.status(403).json({error:"forbidden!"}) ;
        }
        next() ;
    }
}

//for checking CSRF tokens
const checkCsrfToken = (req , res , next) => {
    const csrfToken = req.cookies.csrfToken ;
    const csrfHeader = req.headers['x-csrf-token'] ;
    if (csrfToken !== csrfHeader){
        return res.status(403).json({error:"invalid CSRF token!"}) ;
    }
    next() ;
}

//rate limiting middleware
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: "Too many requests, try again later." }
});//it means that a user can make only 10 requests in 15 minutes to the auth routes



module.exports = {protect , authorize , checkCsrfToken , authLimiter} ;