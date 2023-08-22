const mongoose = require('mongoose');
const Productschema = new mongoose.Schema({
    productcode : {
        type : String
    },
    productName : {
        type : String
    },
    price : {
        type : Number
    },
    category : {
        type : String
    },
    quantity:{
        type : Number
        },
    productImages:{
        type : Array
    },   
    isdelete : {
        type : Boolean,
        default : false
    },
})

const Product = new mongoose.model('Product', Productschema);

module.exports = Product;