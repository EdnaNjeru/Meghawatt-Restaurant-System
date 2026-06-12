const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({

    customer: {
        name: String,
        phone: String,
        location: String
    },

    items: [
        {
            name: String,
            price: Number
        }
    ],

    notes: String,

    total: Number,

    status: {
        type: String,
        default: "pending"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model(
    "Order",
    OrderSchema
);