const express = require("express")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")


async function passwordencrypt (password) {

    let salt = await bcrypt.genSalt(10);
    let passwordHash = bcrypt.hash(password, salt);
    return passwordHash;

}

function passwordvalidation(password) {
    const passvalid = /^[a-zA-Z0-9@#$&%]+$/;    
    return passvalid.test(password);
}


 module.exports = { passwordencrypt, passwordvalidation }




 