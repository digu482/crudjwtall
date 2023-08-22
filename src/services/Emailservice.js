const transporter = require('../config/Emailconfig');
const otpGenerator = require('otp-generator');
const jwtResponse = require('../services/JWTresponse').default;
const generateJwt  = require("../utils/jwt");
const {userverifyToken} = require("../middleware/Auth");
const {passwordencrypt} = require('../services/commonservice')
const msg = require('../utils/ResponseMessage.json')
const User = require('../model/user')
const admin = require("../model/admin")
const nodemailer = require('nodemailer');




exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: msg.NOTFOUND,
      });
    } else {
      if (otp !== user.otp) {
        return res.status(400).json({
          status: 400,
          message: msg.INVALIDOTP,
        });
      } else {
        if (
          user.otpExpiration <
          new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          })
        )
          return res.status(400).json({
            status: 400,
            message: msg.OTPEXPIRED,
          });
        else {
          user.otp = null;
          user.otpExpiration = null;
          await user.save();

          return res.status(201).json({
            status: 201,
            message: msg.OTPVERYSUCC,
          });
        }
      }
    }
  } catch (error) {
    console.log("Error verifying OTP:", error);
    return res.status(500).json({
      status: 500,
      message: msg.ERROROTP,
    });
  }
};




  exports.adminverifyOTP = async (req, res) => {
    const { email, otp } = req.body;
  
    try {
      const user = await admin.findOne({ email });
      if (!user) {
        return res.status(400).json({
          status:400, 
          message: msg.NOTFOUND 
        });
      }
  
      if (otp !== user.otp) {
        return res.status(400).json({
          status:400, 
          message: msg.INVALIDOTP 
        });
      }
  
      if (user.otpExpiration && user.otpExpiration < new Date()) {
        return res.status(400).json({
          status:400, 
          message: msg.OTPEXPIRED 
        });
      }
  
      user.otp = '';
      user.otpExpiration = undefined;
      await user.save();
      return res.status(200).json({
        status:200, 
        message: msg.OTPVERYSUCC 
      });
    } catch (error) {
      console.log('Error verifying OTP:', error);
      return res.status(500).json({
        status:500, 
        message: msg.ERROROCCURED 
      });
    }
  };




  