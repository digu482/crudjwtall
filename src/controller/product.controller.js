const express = require('express')
const Product = require("../model/product")
const msg = require("../utils/ResponseMessage.json")
require("dotenv").config();
const {adminverifyToken} = require("../middleware/Auth")
const jwt = require("jsonwebtoken");
const frontEndUrl =  'http://localhost:1010'



// Add product
exports.addproduct = async (req, res) => {
    try {
      let {
            productcode,
            productName,
            price,
            category,
            quantity
          } = req.body;

      const existproduct = await Product.findOne({
        $or: [{ productName }, { price }],
      });
  
      if(existproduct){
           res.status(400).json({
            status:400, 
            auth: false, 
            message: msg.PEXIST 
          });
       }else{
        productcode = Math.floor(Math.random().toFixed(4) * 9999);
   
        let user = new Product({
            productcode,
            productName,
            price,
            category,
            quantity,
            productImages:req.productImagesUrls
        });
      
         user.save().then((data, error) => {
              if (error) {
              return res.status(400).json({
                status:400,
                message: msg.NOTADD,
              });
              }else{
              return res.status(200).json({
                status:200,
                message: msg.ADD,
                data: data
              })
              }
              });
              }
            
        } catch (error) {
         console.log(error);
        }
};





//Find all product
exports.findall = async (req, res) => {
  try {
    let productdata = await Product.find();
    if (!productdata) {
      return res.status(400).json({
        status:400,
        error: true,
        message: msg.NOTFOUND,
      });
    }else{
    res.status(200).json({
      status:200,
      productdata,
      message: msg.LOGIN,
    });
  }
  } catch (error) {
    console.log(error);
  }
};





//product find
exports.productfind = async (req, res) => {
  try {
    let _id = req.params.id;
    let productdata = await Product.findById(_id);
    if (!productdata) {
      return res.status(400).json({
        status:400,
        error: true,
        message: msg.NOTFOUND,
      });
    }else{
    res.status(200).json({
      status:200,
      productdata,
      message: msg.LOGIN,
    });
  }
  } catch (error) {
    console.log(error);
  }
};





//Update user data
exports.updateproduct = async (req, res) => {
  try {
    let _id = req.params.id;
    let productdata = await Product.findById(_id);
    if (!productdata) {
      return res.status(400).json({
        status:400,
        message:msg.NOTFOUND,
      });
    }else{
    await Product.findByIdAndUpdate(_id, req.body, { useFindAndModify: false ,new :true});
    res.status(200).json({
      status:200,
       message: msg.USERUPSUCC,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};





//Product delete
exports.productdelete = async (req, res) => {
    try {
      const _id = req.params.id
      let user = await Product.findById(_id);
      if (!user) {
        Product.findByIdAndUpdate({ _id: user._id }, { isdelete: true });
        return res.status(400).json({
          status:400, 
          message: msg.PNOTFOUND 
        });
      }
      else {
        user.isdelete = true;
        await user.save();
      }
      return res.status(200).json({
        status:200, 
        message: msg.PDELETE 
      });
    }
    catch (error) {
      console.log(error);
      res.status(500).json({
        status:500,
        message: msg.ERROR1,
      });
    }
};






  //product Images update
  exports.updateproductImage = async (req, res) => {
    try {
      const _id = req.params.id;
      const productdata = await Product.findById(_id);
  
      if (!productdata) {
        return res.status(400).json({
          status:400, 
          message: msg.PNOTFOUND, 
        });
      }
      else{
      // Handle document update logic here
      if (req.files && req.files.productImages) {
        const productImagesUrl = `${frontEndUrl}/product Image/${req.files.productImages[0].filename}`;
        productdata.productImages = productImagesUrl;
  
        // Save the updated document URL to the database
        await productdata.save();
  
        return res.status(200).json({
          status:200, 
          message: msg.PIMGUPD, 
          productImagesUrl, 
        });
      } else {
        return res.status(400).json({
          status:400, 
          message: msg.UPLOADFILE, 
        });
      }
    }
    } catch (error) {
      res.status(500).json({
        status:500, 
        message: msg.ERROR2, 
      });
    }
  };
