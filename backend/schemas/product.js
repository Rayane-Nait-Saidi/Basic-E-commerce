const mongoose = require('mongoose') ;

const shm = new mongoose.Schema({
    name:{type:String , required:true},
    description:{type:String , required:true},
    price:{type:Number , required:true},
    image:{type:String , required:true},//the url of the image in the cloud
    category:{type:String , required:true},
    stock:{type:Number , required:true},
}) ; 

module.exports = mongoose.model("products" , shm) ;