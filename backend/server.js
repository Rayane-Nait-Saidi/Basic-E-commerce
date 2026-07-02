require('dotenv').config() ;
const express = require("express") ; 
const app = express() ;
app.use(express.json());
const cors = require('cors') ;
const helmet = require('helmet') ;
app.use(helmet()) ;//for security headers for all routes
app.use(cors({
    origin:"http://localhost:5173" ,//recieve requests only from this oringin
    methods:["POST" , "GET" , "PUT" , "DELETE"],
    credentials:true,//without it browser cannot send cookies
    allowedHeaders:["Content-Type" , "x-csrf-token"]//accept requests that have these headers only
})) ;

//CSP : it will be applied to all routes
app.use(
    (req , res , next) => {
        res.setHeader("Content-Security-Policy" , "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self' http://localhost:5173; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests; block-all-mixed-content; report-uri /csp-report");
        next();
    }
)

const cookieParser = require('cookie-parser') ;
app.use(cookieParser());
const mongoose = require('mongoose') ;
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize()) ; //applied to all routes to prevent NoSQL injection attacks
const jwt = require('jsonwebtoken') ;
const token = require('./schemas/token');
const crypto = require('crypto') ;
const bcrypt = require('bcrypt') ;
const {protect} = require('./middlewares') ;

async function run(){
    try{
        await mongoose.connect("mongodb://127.0.0.1:27017/codealpha1");
        console.log("db connected✅");
        app.get('/' , (req,res) => {
            res.send("welcome to small E-commerce!");
        })

        //route for switching accounts
        app.get('/switchaccount' , protect , async(req,res) => {
            try{
                //the protect middleware will do all the job for us , it will check the access token and set the req.user object
                res.json({succ:"successful!" , id:req.user.id}) ;
            }catch(e){
                res.status(401).json({error:"unauthorized!"}) ;
            }
        }) ;

        // a router for refreshing token using the rotation technique
        app.post("/refresh", async(req,res) => {
    const oldRefreshToken = req.cookies.refreshToken;  // 👈 renamed
    if (!oldRefreshToken){
        return res.status(401).json({error:"unauthorized!"});
    }

    try{
        const decoded = jwt.verify(oldRefreshToken, process.env.REFRESH_SECRET);
        const userId = decoded.userId;  // also fix this per the previous message
        const role = decoded.role;

        let found = null;
        const tokens = await token.find({userId:userId});
        for (let i=0; i<tokens.length; i++){
            const isMatch = await bcrypt.compare(oldRefreshToken, tokens[i].tokenhash);
            if (isMatch){
                found = tokens[i];
                break;
            }
        }

        if (!found){
            await token.deleteMany({userId:userId});
            return res.status(401).json({error:"unauthorized!"});
        }

        await token.deleteOne({_id:found._id});

        const accessToken = jwt.sign({userId:userId, role:role}, process.env.JWT_SECRET, {expiresIn:"1h"});
        const newRefreshToken = jwt.sign({userId:userId, role:role}, process.env.REFRESH_SECRET, {expiresIn:"7d"}); // 👈 renamed
        const csrfToken = crypto.randomBytes(32).toString('hex');

        await token.create({
            userId:userId,
            tokenhash: await bcrypt.hash(newRefreshToken, 14),
            expiresAt: new Date(Date.now() + 7*24*60*60*1000)
        });

        res.cookie("refreshToken", newRefreshToken, {httpOnly:true, secure:false, sameSite:"strict", maxAge:7*24*60*60*1000});
        res.cookie("csrfToken", csrfToken, {httpOnly:false, secure:false, sameSite:"strict", maxAge:7*24*60*60*1000});
        res.cookie("accessToken", accessToken, {httpOnly:true, secure:false, sameSite:"strict", maxAge:60*60*1000});

        res.json({succ:"token refreshed!"});
    }catch(e){
        console.error(e);
        return res.status(401).json({error:"unauthorized!"});
    }
});

app.post('/logout' , protect , async(req,res) => {
    try{
        const userId = req.user.id ;
        await token.deleteMany({userId:userId}) ;
        res.clearCookie("refreshToken") ;
        res.clearCookie("csrfToken") ;
        res.clearCookie("accessToken") ;
        res.json({succ:"logged out successfully!"}) ;
    }catch(e){
        console.error(e) ;
        res.status(500).json({error:"internal server error!"}) ;
    }
})

        app.use("/logs" , require('./authServer')) ;
        app.use("/client" , require('./clientServer')) ;

        app.listen(3000 , () => {
            console.log("server running on port 3000");
        })
    }catch(e){
        console.log("Error in main server!");
        console.error(e);
    }
}

run() ;