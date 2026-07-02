//require('dotenv').config() ; 
const express = require('express') ; 
const router = express.Router() ; 
const { body , validationResult } = require('express-validator');
const  jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const user = require('./schemas/user') ; 
const pending_user = require('./schemas/pending_user') ; 
const token = require('./schemas/token') ; 
const nodemailer = require('nodemailer') ;
const axios = require('axios') ;
const crypto = require('crypto') ;
const sanitizehtml = require('sanitize-html') ;
const {authLimiter1 , authLimiter2} = require('./middlewares') ; //import the rate limiting middleware


async function sendEmail({ to, subject, html }) {
  await axios.post('https://api.brevo.com/v3/smtp/email', {
    sender: { name: "CodeAlpha E-Commerce", email: "nr_nait_saidi@esi.dz" },
    to: [{ email: to }],
    subject,
    htmlContent: html
  }, {
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json'
    }
  });
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildNotificationHtml({ recipientName = '', mainHtml = '' }) {
  const safeName = escapeHtml(recipientName);
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f8f4ff;">
  <div style="max-width:680px;margin:0 auto;padding:32px 16px;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#1a1523;">
    <div style="background:#ffffff;border:0.5px solid #e5e0f5;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(167,139,250,0.08);">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#a78bfa 0%,#c084fc 100%);padding:28px 30px;text-align:center;">
        <!-- Logo mark -->
        <div style="width:42px;height:42px;border-radius:10px;background:rgba(255,255,255,0.2);margin:0 auto 14px auto;display:flex;align-items:center;justify-content:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div style="color:rgba(255,255,255,0.75);font-size:11px;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:6px;">Notification officielle</div>
        <div style="color:#ffffff;font-size:22px;font-weight:700;">E-commerce CodeAlpha</div>
      </div>

      <!-- Body -->
      <div style="padding:32px 30px;line-height:1.8;font-size:15px;color:#1a1523;">
        <p style="margin:0 0 16px 0;">Bonjour <strong>${safeName}</strong>,</p>
        ${mainHtml}
        <p style="margin:20px 0 4px 0;color:#5b4f72;">Cordialement,</p>
        
      </div>

    </div>
  </div>
</body>
</html>`;
} 


function generateCode() {
  return Math.floor(100000 + Math.random() * 900000);
}

router.post('/register' , authLimiter1 , 
body("username").trim().isString().isLength({min:3 , max:30}),
body("email").trim().isString().normalizeEmail().isLength({min:0 , max:60}),
body("password").trim().isString().isLength({min:8 , max:16}) ,
async(req , res) => {
    const errors = validationResult(req) ;
    if (!errors.isEmpty()){
        return res.status(400).json({error:errors.array()})
    }
    try{
        let {username , email , password} = req.body ;
        username = sanitizehtml(username) ;
        email = sanitizehtml(email) ;
        const u1 = await user.findOne({email}) ; 
        if (u1){
            return res.json({message:"account with same info exist!"}) ; 
        }
        const code = generateCode() ;
        const mainHtml = `<p style="margin:0 0 18px 0;">Nous vous contactons concernant la vérification de votre compte.</p>
            <div style="background:#f8fafc;border-left:4px solid #2563eb;border-radius:12px;padding:18px 20px;margin:18px 0 20px 0;color:#1f2937;">
              <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:8px;">Code de vérification</div>
              <div style="font-size:20px;font-weight:700;">${escapeHtml(code)}</div>
            </div>
            <p style="margin:0 0 6px 0;">Ce code vous permettra de terminer l'inscription.</p>`;
        
        await sendEmail({
            to: email,
            subject: "Verify your mail!",
            html: buildNotificationHtml({ recipientName: `${username}`, mainHtml })
        });
        
        //hash the code!!
        const hashedpw = await bcrypt.hash(password , 14) ;
        const m = await pending_user.findOne({email});
        if (m){
            await m.deleteOne() ; // good if the user exists the app and do new registration
        }

        const a = await pending_user.create({
            username , 
            email ,
            password : hashedpw ,
            role:"user",
            code,
        }) ;

        res.json({succ:"email sent!" , email:email , id:a._id}) ;

    }catch(e){
        res.json({error:"invalid credentials"}) ;
        console.log(e) ;
    }
}
)


router.put('/resend' , authLimiter1, body("email").trim().isString().normalizeEmail().isLength({min:0 , max:60}), async(req , res) => {
  const errors = validationResult(req) ;
  if (!errors.isEmpty()){
      return res.status(400).json({error:errors.array()})
  }
  try{
    let {email} = req.body ; 
    email = sanitizehtml(email) ;
    //after 10 minutes the code and the whole document will be deleted from the DB automatically
    //so before sending , check if the user exists in the pending_user collection
    const m = await pending_user.findOne({email}) ;
    if (!m){
      return res.json({error:"no pending user found!"}) ;
    }
    //now generate a new code and update the document
    const code = generateCode() ;
    const mainHtml = `<p style="margin:0 0 18px 0;">Nous vous contactons concernant la vérification de votre compte.</p>
        <div style="background:#f8fafc;border-left:4px solid #2563eb;border-radius:12px;padding:18px 20px;margin:18px 0 20px 0;color:#1f2937;">
          <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:8px;">Code de vérification</div>
          <div style="font-size:20px;font-weight:700;">${escapeHtml(code)}</div>
        </div>
        <p style="margin:0 0 6px 0;">Ce code vous permettra de terminer l'inscription.</p>`;
      
        
      await sendEmail({
          to: email,
          subject: "Verify your mail!",
          html: buildNotificationHtml({ recipientName: `${m.username}`, mainHtml })
      });
      
      //update the code in the pending_user document
      m.code = code ; 
      await m.save() ;
      res.json({succ:"email sent!"}) ;
  }catch(e){
    res.json({error:"invalid credentials"}) ;
    console.log(e) ;
  }
})

router.post('/verifycode' , authLimiter1 , body("code").isNumeric().isLength({min:6, max:6}) , body("email").trim().isString().normalizeEmail().isLength({min:0 , max:60}) , async(req , res) => {
    const errors = validationResult(req) ;
    if (!errors.isEmpty()){
        return res.status(400).json({error:errors.array()})
    }
    try{
        let {code , email} = req.body ;
        email = sanitizehtml(email) ;
        const m = await pending_user.findOne({email}) ;
        if (!m){
          return res.json({error:"no pending user found!"}) ;
        }
        //check the code
        if (m.code !== Number(code)){
          return res.json({error:"incorrect code!"})
        } 
        //now create the new user finally
        const a = await user.create({
          username:m.username ,
          email , 
          password:m.password ,
          role:"user",
        }) ;

        //delete the pending user 
        await m.deleteOne() ;
        //now for tokens and cookies management
        const accessToken = jwt.sign({userId:a._id , role:a.role} , process.env.JWT_SECRET , {expiresIn:"1h"}) ;
        res.cookie("accessToken" , accessToken , {httpOnly:true , secure:false , sameSite:"strict" , maxAge:3600000}) ; //1 hour
        const refreshToken = jwt.sign({userId:a._id , role:a.role} , process.env.REFRESH_SECRET , {expiresIn:"7d"}) ;
        const hashedRefreshToken = await bcrypt.hash(refreshToken , 14) ;
        await token.create({userId:a._id , tokenhash:hashedRefreshToken , expiresAt: new Date(Date.now() + 7*24*60*60*1000)}) ; //7 days
        res.cookie("refreshToken" , refreshToken , {httpOnly:true , secure:false , sameSite:"strict" , maxAge:7*24*60*60*1000}) ;
        //for csrf tokens 
        const scrfToken = crypto.randomBytes(32).toString('hex') ; 
        res.cookie("csrfToken" , scrfToken , {httpOnly:false , secure:false , sameSite:"strict" , maxAge:7*24*60*60*1000}) ;
        res.json({succ:"account created!" , id:a._id}) ;
    }catch(e){
      res.json({error:"invalid credentials"}) ;
      console.log(e) ;
    }
});


//login route 
router.post('/login' , authLimiter2 ,
body("email").trim().isString().normalizeEmail().isLength({min:0 , max:60}) ,
body("password").trim().isString().isLength({min:8, max:16})  
, async(req , res) => {
   try{
      let {email , password} = req.body ;
      email = sanitizehtml(email) ;
      //check if this user exists 
      const u = await user.findOne({email}) ;
      if (!u){
         return res.json({error:"invalid credentials"}) ;
      }

      //check the password
      const ismatch = await bcrypt.compare(password , u.password) ;
      if (!ismatch){
         return res.json({error:"invalid credentials"}) ;
      }
      //now for tokens and cookies management
      const accessToken = jwt.sign({userId:u._id , role:u.role} , process.env.JWT_SECRET , {expiresIn:"1h"}) ;
      res.cookie("accessToken" , accessToken , {httpOnly:true , secure:false , sameSite:"strict" , maxAge:3600000}) ; //1 hour
      const refreshToken = jwt.sign({userId:u._id , role:u.role} , process.env.REFRESH_SECRET , {expiresIn:"7d"}) ;
      const hashedRefreshToken = await bcrypt.hash(refreshToken , 14) ;
      await token.create({userId:u._id , tokenhash:hashedRefreshToken , expiresAt: new Date(Date.now() + 7*24*60*60*1000)}) ;
      res.cookie("refreshToken" , refreshToken , {httpOnly:true , secure:false , sameSite:"strict" , maxAge:7*24*60*60*1000}) ;
      const scrfToken = crypto.randomBytes(32).toString('hex') ;
      res.cookie("csrfToken" , scrfToken , {httpOnly:false , secure:false , sameSite:"strict" , maxAge:7*24*60*60*1000}) ;
      res.json({succ:"login successful!" , id:u._id , role:u.role}) ;
   }catch(e){
      res.json({error:"invalid credentials"}) ;
      console.log(e) ;
   }
}) ;

router.post('/forgetpassword' , authLimiter2 ,
body("email").trim().isString().normalizeEmail().isLength({min:0 , max:60}) ,
async(req , res) => {
  const errors = validationResult(req) ;
  if (!errors.isEmpty()){
      return res.status(400).json({error:errors.array()})
  }

  try{
    let {email} = req.body ;
    email = sanitizehtml(email) ;
    const u = await user.findOne({email}) ;
    if (!u){
      return res.json({error:"no user found!"}) ;
    }

    //generate a new code and send it to the user 
    const code = generateCode() ;
    const mainHtml = `<p style="margin:0 0 18px 0;">Nous vous contactons concernant la réinitialisation de votre mot de passe.</p>
        <div style="background:#f8fafc;border-left:4px solid #2563eb;border-radius:12px;padding:18px 20px;margin:18px 0 20px 0;color:#1f2937;">
          <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:8px;">Code de vérification</div>
          <div style="font-size:20px;font-weight:700;">${escapeHtml(code)}</div>
        </div>
        <p style="margin:0 0 6px 0;">Ce code vous permettra de réinitialiser votre mot de passe.</p>`;
    await sendEmail({
      to: email,
      subject: "Password Reset Code",
      html: buildNotificationHtml({ recipientName: `${u.username}`, mainHtml })
    });
    
    //store the code in httpOnly cookie for 10 minutes
    res.cookie("resetCode" , code , {httpOnly:true , secure:false , sameSite:"strict" , maxAge:10*60*1000}) ;//10 minutes
    res.json({succ:"email sent!" , id:u._id}) ;
  }catch(e){
    res.json({error:"invalid credentials"}) ;
    console.log(e) ;
  }
})

router.put("/resetcode" , authLimiter2, body("email").trim().isString().normalizeEmail().isLength({min:0 , max:60}) , async(req , res) => {
  //regenerate a new code and send it to the user and store it in the cookie again for 10 minutes
  try{
    let {email} = req.body ;
    email = sanitizehtml(email) ;
    const u = await user.findOne({email}) ;
    if (!u){
      return res.json({error:"no user found!"}) ;
    }
    const code = generateCode() ;
    const mainHtml = `<p style="margin:0 0 18px 0;">Nous vous contactons concernant la réinitialisation de votre mot de passe.</p>
        <div style="background:#f8fafc;border-left:4px solid #2563eb;border-radius:12px;padding:18px 20px;margin:18px 0 20px 0;color:#1f2937;">
          <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:8px;">Code de vérification</div>
          <div style="font-size:20px;font-weight:700;">${escapeHtml(code)}</div>
        </div>
        <p style="margin:0 0 6px 0;">Ce code vous permettra de réinitialiser votre mot de passe.</p>`;
    await sendEmail({
      to: email,
      subject: "Password Reset Code",
      html: buildNotificationHtml({ recipientName: `${u.username}`, mainHtml })
    });
    res.cookie("resetCode" , code , {httpOnly:true , secure:false , sameSite:"strict" , maxAge:10*60*1000}) ;//10 minutes
    res.json({succ:"email sent!"}) ;

  }catch(e){
    res.json({error:"invalid credentials"}) ;
    console.log(e) ;
  }
});

router.post("/checkcode" , authLimiter2 , body("code").isNumeric().isLength({min:6, max:6}) , body("email").trim().isString().normalizeEmail().isLength({min:0 , max:60}) , async(req , res) => {
  try{
    let {email, code} = req.body ;
    email = sanitizehtml(email) ;
    const resetCode = req.cookies.resetCode ; 
    const u = await user.findOne({email}) ;
    if(!u){
      return res.json({error:"no user found!"}) ;
    }
    if (!resetCode){
      return res.json({error:"no reset code found!"}) ;
    }
    if (Number(code) !== Number(resetCode)){
      return res.json({error:"incorrect code!"}) ;
    }
    res.json({succ:"code is correct!" , id:u._id}) ;
  }catch(e){
    res.json({error:"invalid credentials"}) ;
    console.log(e) ;
  }
})

router.post("/resetpassword" , authLimiter2 ,
  body("email").trim().isString().normalizeEmail().isLength({min:0 , max:60}) ,
  body("password").trim().isString().isLength({min:8 , max:16}) ,
  body("confirm").trim().isString().isLength({min:8 , max:16})  
  , async(req , res) => {
   const errors = validationResult(req) ;
   if (!errors.isEmpty()){
       return res.status(400).json({error:errors.array()})
   } 
   try{
      let {email , password , confirm} = req.body ;
      email = sanitizehtml(email) ;
      if (password !== confirm){
        return res.json({error:"passwords do not match!"}) ;
      }
      const u = await user.findOne({email}) ;
      if (!u){
        return res.json({error:"no user found!"}) ;
      }
      u.password = await bcrypt.hash(password , 14) ;
      await u.save() ; 
      res.json({succ:"password reset successful!"}) ;
   }catch(e){
      res.json({error:"invalid credentials"}) ;
      console.log(e) ;
   }
})

module.exports = router ; 

/*
overall :
the system of signin/signup/forget password is implemented with security in mind, using JWT tokens, CSRF protection, rate limiting, and secure cookie handling. The email verification and password reset processes are also handled securely with unique codes sent to the user's email.
however , of course there are always more security measures that can be implemented in the future such as :
-API versioning — /api/v1/logs/register instead of /logs/register
-Request ID tracking — each request gets a unique ID for tracing errors
-Unit tests — companies expect Jest or Mocha tests for auth routes
-Swagger/OpenAPI docs — documenting your endpoints
-Docker — containerizing the app for deployment
*/