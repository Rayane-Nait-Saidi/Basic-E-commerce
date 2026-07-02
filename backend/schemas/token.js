const mongoose = require('mongoose') ; 

const shm = new mongoose.Schema({
    userId : {type:mongoose.Schema.Types.ObjectId , ref:"users" , required:true} ,
    tokenhash : {type:String , required:true} ,
    createdAt : {type:Date , default:Date.now} , 
    expiresAt : {type:Date , required:true}
}) ; 

module.exports = mongoose.model("tokens" , shm) ;