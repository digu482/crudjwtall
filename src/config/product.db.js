const mongoose = require("mongoose")

mongoose.connect("mongodb://localhost:27017/DIGU",{

}).then(() =>{
    console.log("connection succesfull")
}).catch((e) => {
    console.log("no connection");
})