const express = require('express')
const router = express.Router()
const Product = require("../model/product")
const controller = require("../controller/product.controller")
const uploadFile = require("../middleware/upload")
const {adminverifyToken} = require("../middleware/Auth")
const frontEndUrl =  'http://localhost:1010'


router.post("/addproduct",adminverifyToken,uploadFile,controller.addproduct)
router.get("/findallproduct",controller.findall);
router.get("/productfind/:id",controller.productfind);
router.patch("/updateproduct/:id",adminverifyToken,controller.updateproduct);
router.patch("/updateproductImage/:id",adminverifyToken,uploadFile,controller.updateproductImage)
router.delete("/productdelete/:id",adminverifyToken,controller.productdelete)


module.exports = router