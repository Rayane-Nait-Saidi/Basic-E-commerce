const mongoose = require('mongoose'); 
const shm = new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId , ref:'users' , required:true} ,
    product:{type:mongoose.Schema.Types.ObjectId , ref:'products' , required:true} ,
    quantity:{type:Number , required:true}
})

module.exports = mongoose.model('orders' , shm) ;