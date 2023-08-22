const express = require('express')
const router = express.Router()
const admin = require("../model/admin")
const controller = require("../controller/admin.controller")
const {adminverifyToken} = require("../middleware/Auth")
const User = require("../model/user")
const EmailService = require('../services/Emailservice')
const uploadFile = require("../middleware/upload")



router.post("/",controller.createAdmin);
router.post("/login",controller.adminLogin);
router.post("/logout", adminverifyToken,controller.logout);
router.post("/adminchangepassword",adminverifyToken,controller.adminchangepassword);



router.post("/create",uploadFile,controller.admincreateuser);
router.get("/adminfindalluser",adminverifyToken,controller.adminfindalluser)
router.delete("/admindeleteuser",adminverifyToken,controller.admindeleteuser)
router.post("/adminreactivateuser",adminverifyToken,controller.adminreactivateuser)
router.patch("/adminupdateuser/:id",adminverifyToken,controller.adminupdateuser)



router.post("/adminforgotpassword",controller.adminforgotpassword)
router.post("/adminverifyOTP", EmailService.adminverifyOTP);
router.post("/adminResetpassword",controller.adminResetpassword)



module.exports = router