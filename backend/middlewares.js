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
const createAuthLimiter = (windowMs, max) => rateLimit({
    windowMs,
    max,
    message: { error: "Too many requests, try again later." }
});

// General auth flows with a slightly higher ceiling for normal testing.
const authLimiter1 = createAuthLimiter(15 * 60 * 1000, 20); // 15 minutes, 20 requests

// Login / reset flows: still protected, but more forgiving while the user retries.
const authLimiter2 = createAuthLimiter(10 * 60 * 1000, 25); // 10 minutes, 25 requests

// Search / order actions: keep these responsive during repeated dashboard usage.
const authLimiter3 = createAuthLimiter(1 * 60 * 1000, 60); // 1 minute, 60 requests

module.exports = {protect , authorize , checkCsrfToken , authLimiter1 , authLimiter2 , authLimiter3} ;