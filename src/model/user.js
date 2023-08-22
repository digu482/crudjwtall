const mongoose = require('mongoose');
const Userschema = new mongoose.Schema({
    username :{
        type : String
    },
    firstName : {
        type : String
    },
    lastName : {
        type : String
    },
    profile : {
        type : Array
    },
    email : {
        type : String, 
        unique : true
    },
    mobile : {
        type : Number,
        unique:true
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
    isdelete : {
        type : Boolean,
        default : false
    },
    token: {
        type: String
    }
},{ versionKey: false })

const User = new mongoose.model('User', Userschema);

module.exports = User;