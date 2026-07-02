//require('dotenv').config() ;
const express = require('express');
const router = express.Router();
const { body , validationResult } = require('express-validator');
const jwt = require('jsonwebtoken') ;
const products = require('./schemas/product') ;
const {protect , authorize , authLimiter3 , checkCsrfToken} = require('./middlewares') ;
const users = require('./schemas/user') ;
const orders = require('./schemas/order') ;

router.get('/profile' , protect ,authorize('user'),async(req , res) => {
    try{
        const userId = req.user.id ;
        const user = await users.findById(userId).select('-password') ;
        if(!user){
            return res.status(404).json({error:"user not found!"}) ;
        }
        //extract all the prosucts 
        const productsList = await products.find() ; 
        res.status(200).json({succ:"success",username: user.username, productsList , userId:userId}) ;
    }catch(e){
        res.status(500).json({error:"internal server error!"}) ;
        console.error(e) ;
    }
})

router.post("/search", 
  body("searchby").isString().trim().isIn(["Name","Category"]).isLength({ min: 4, max: 8 }),
  body("searchquery").isString().trim().isLength({ min: 0, max: 50 }),
  protect, checkCsrfToken, authorize('user'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }

    try {
      let { searchby, searchquery } = req.body;
      // no .toLowerCase() needed anywhere here

      if (searchquery.length === 0) {
        const productsList = await products.find();
        return res.status(200).json({ succ: "success", productsList });
      }

      if (searchby === "Name") {
        const productsList = await products.find({ name: { $regex: searchquery, $options: "i" } });
        return res.status(200).json({ succ: "success", productsList });
      } else if (searchby === "Category") {
        const productsList = await products.find({ category: { $regex: searchquery, $options: "i" } });
        return res.status(200).json({ succ: "success", productsList });
      }
    } catch (e) {
      res.status(500).json({ error: "internal server error!" });
      console.error(e);
    }
  }
);

router.post('/order' , authLimiter3 , body("quantity").isNumeric().isInt({ min: 1 }), protect , authorize('user') , checkCsrfToken , async(req , res) => {
   const errors = validationResult(req) ;
    if(!errors.isEmpty()){
        return res.status(400).json({error:errors.array()}) ;
    }

    try{
        const { productId , quantity } = req.body ;
        const userId = req.user.id ;
        const product = await products.findById(productId) ;
        if (!product){
            return res.status(404).json({error:"product not found!"}) ;
        }
        if (product.stock < quantity){
            return res.status(400).json({error:"insufficient stock!"}) ;
        }
        await orders.create({user:userId , product:productId , quantity}) ;
        product.stock -= quantity ;
        await product.save() ;
        res.status(201).json({succ:"order created successfully!"}) ;
    }catch(e){
        res.status(500).json({error:"internal server error!"}) ;
        console.error(e) ;
    }
})

//the route that fetches all the orders of a user
router.get('/orders' , protect , authorize('user') , async(req , res) => {
    try{
        const userId = req.user.id ;
        const userOrders = await orders.find({user:userId}).populate('product') ;
        res.status(200).json({succ:"success" , orders:userOrders}) ;
    }catch(e){
        res.status(500).json({error:"internal server error!"}) ;
        console.error(e) ;
    }
});

router.delete('/deleteorder' , authLimiter3 , protect , authorize('user') , checkCsrfToken , async(req , res) => {
    try{
        const { orderId } = req.body ;
        const order = await orders.findById(orderId) ;
        if(!order){
            return res.status(404).json({error:"order not found!"}) ;
        }
        //restore the stock of the product
        const product = await products.findById(order.product) ;
        if(!product){
            return res.status(404).json({error:"product not found!"}) ;
        }
        product.stock += order.quantity ;
        await product.save() ;
        await order.deleteOne() ;
        
        res.status(200).json({succ:"order deleted successfully!"}) ;
    }catch(e){
        res.status(500).json({error:"internal server error!"}) ;
        console.error(e) ;
    }
}) ;



module.exports = router ;
