const mongoose = require('mongoose');
const adminschema = new mongoose.Schema({
    username :{
        type : String
    },
    firstName : {
        type : String
    },
    lastName : {
        type : String
    },
    adminName : {
        type : String
    },
    profile : {
        type : Array
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
    email : {
        type : String, 
        unique : true
    },
    mobile : {
        type : Number
    },
    password : {
        type : String
    },
    otp : {
        type : String
    },
    otpExpiration : {
        type: String,
    },
    token: {
        type: String
    }
},{ versionKey: false })
    

const admin = new mongoose.model('admin', adminschema);

module.exports = admin;