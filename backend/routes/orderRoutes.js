const express = require("express");

const router = express.Router();

const Order = require("../models/Order");


// Create order
router.post("/", async(req,res)=>{

try{

const order = new Order(req.body);

await order.save();

res.status(201).json({

message:"Order created",
id:order._id

});

}

catch(error){

res.status(500).json(error);

}

});



// Get pending orders
router.get("/", async(req,res)=>{

try{

const orders = await Order.find({

status:"pending"

});

res.json(orders);

}

catch(error){

res.status(500).json(error);

}

});



// Mark order served
router.put("/:id", async(req,res)=>{

try{

await Order.findByIdAndUpdate(

req.params.id,

{

status:"served"

}

);

res.json({

message:"Order updated"

});

}

catch(error){

res.status(500).json(error);

}

});

module.exports = router;