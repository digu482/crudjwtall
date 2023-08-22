const express = require('express')
const User = require("../model/user")
const bcrypt = require("bcrypt")
const {passwordencrypt} = require("../services/commonservice")
const {passwordvalidation} = require("../services/commonservice")
require("dotenv").config();
const msg = require("../utils/ResponseMessage.json")
const {userverifyToken} = require("../middleware/Auth");
const jwt = require("jsonwebtoken");
const {generateJwt} = require("../utils/jwt")
const transporter = require("../config/Emailconfig")
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const uploadFile = require("../middleware/upload")
const frontEndUrl =  'http://localhost:1010'



//signing user
exports.createuser = async (req, res) => {
  try {
    let {
      username,
      firstName,
      lastName,
      email,
      mobile,
      password
    } = req.body;

    const existuser = await User.findOne({
      $or: [{email}, {mobile}],
    });
    if (
      !firstName || !lastName || !email || 
      firstName.includes(' ') || lastName.includes(' ') || email.includes(' ') 
    ) {
      return res.status(400).json({
        status: 400,
        message: msg.REQUIREDNOSPACES,
      });
    }
    let existemail = await User.findOne({ email });
    let existmobile = await User.findOne({ mobile });

    if (existemail || existmobile) {
      const message =
        existemail && existmobile
          ? `${msg.EXISTEMAIL} and ${msg.EXISTMOBILE}`
          : existemail
          ? msg.EXISTEMAIL
          : msg.EXISTMOBILE;

      res.status(400).json({ status: 400, message });
    } 
    if(!passwordvalidation(password)) {
      return res.status(400).json({
        status:400,
        message:msg.PASSWORDVALID,
      })
    }
    if (!existuser) {
      username = (firstName + lastName).toLowerCase() + Math.floor(Math.random().toFixed(4) * 9999);
      password = await passwordencrypt(password);
      email = email.toLowerCase();

      let user = new User({
        username,
        firstName,
        lastName,
        profile: req.profileUrl,
        email,
        mobile,
        password
      });

      user.save().then((data, error) => {
        if (error) {
          return res.status(400).json({ 
            status: 400,
            message: msg.NOTCREATE, 
          });
        } else {
          return res.status(201).json({
            status: 201,
            message: msg.CREATE,
            data: data,
          });
        }
      });
  } else { 
    return res.status(400).json({
      status:400,
      auth: false,
      message: msg.EXIST,  
    });
  }

} catch (error) {
    console.log(error);
  }
};




//User find
exports.userfind = async (req, res) => {
  try {
    let userdata = await User.findById({ _id: req.currentUser });
    if (!userdata) {
      return res.status(404).json({
        status:404,
        error: true,
        message: msg.NOTFOUND,
      });
    }else{
      res.status(201).json({
        status:201,
        userdata,
        message: msg.LOGIN,
      });
    }
  } catch (error) {
    console.log(error);
  }
};




// Update user data
exports.updateuser = async (req, res) => {
  try {
    let _id = req.params.id;
    let user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({
        status:404,
        message: msg.NOTFOUND,
      });
    } else {
      const { firstName, lastName, email, mobile } = req.body;
      
      const existemail = await User.findOne({ email, _id: { $ne: user._id } });
      const existmobile = await User.findOne({ mobile, _id: { $ne: user._id } });

    if (existemail || existmobile) {
      const message =
        existemail && existmobile
          ? `${msg.EXISTEMAIL} and ${msg.EXISTMOBILE}`
          : existemail
          ? msg.EXISTEMAIL
          : msg.EXISTMOBILE;

      res.status(400).json({ status: 400, message });
    }
      let updatedUser = {
        firstName,
        lastName,
        email,
        mobile,
      };
      await User.findByIdAndUpdate(_id, updatedUser, { useFindAndModify: false });
      return res.status(200).json({
        status:200, 
        message: msg.USERUPDSUCC 
      });
    }
  } catch (error) {
    res.status(400).json({
      status:400,
      message: error.message,
    });
  }
};




//user soft delete
exports.userdelete = async (req, res) => {
  try {
    const userId = req.currentUser;
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: msg.NOTFOUND,
      });
    } else {
    await User.findByIdAndUpdate(userId, { $set: { isdelete: true } }, { useFindAndModify: false });
    return res.status(200).json({
      status: 200,
      Msg: msg.DELETE,
    });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: 400,
      message: error.message,
    });
  }
};




//user change the password
exports.changepassword = async (req, res) => {
  const { email, currentPassword, newPassword, confirmPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status:404, 
        message: msg.NOTFOUND 
      });
    } else {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          status:400,
          message: msg.INCORRECT 
        });
      } else {
        if(!passwordvalidation(newPassword)) {
          return res.status(400).json({
            status:400,
            message:msg.PASSWORDVALID,
          })
        }
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
          return res.status(400).json({
            status:400,
            message: msg.NEWDIFFERENTOLD 
          });
        } else {
          if (newPassword !== confirmPassword) {
            return res.status(400).json({
              status:400,
              Msg: msg.NEWCOMMATCH 
          });
          } else {
            const hashedPassword = await passwordencrypt(newPassword, user.password);
            await User.updateOne({ _id: user._id },{ $set: { password: hashedPassword } }
            );
            return res.status(200).json({
              status:200, 
              Msg: msg.PSSWORDCHANGESUCC 
            });
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};




//Login user
exports.UserLogin = async (req, res) => {
  try {
    let { username, email, mobile, password, _id } = req.body;
    let userLogin = await User.findOne({
      $or: [
        { email },
        { username },
        { mobile },
      ],
    });
    if (!userLogin) {
      return res.status(404).json({
        status: 404,
        error: true,
        message: msg.NOTFOUND,
      });
    } else {
      if (userLogin.isdelete) {
        return res.status(400).json({
          status: 400,
          error: true,
          message: msg.ISDELETE,
        });
      } else {
        const isvalid = await bcrypt.compare(password, userLogin.password);
        if (!isvalid) {
          return res.status(400).json({
            status: 400,
            error: true,
            message: msg.NOTMATCH,
          });
        } else {
          const { error, token } = await generateJwt(userLogin._id);
          if (error) {
            return res.status(400).json({
              status: 400,
              error: true,
              message: msg.TOKEN,
            });
          } else {
            await User.findOneAndUpdate({ _id: userLogin._id }, { $set: { token: token } }, { useFindAndModify: false });
            return res.status(201).json({
              status: 201,
              success: true,
              token: token,
              userLogin:email,
              message: msg.SUCCESS,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Login error", err);
    return res.status(400).json({
      status: 400,
      error: true,
      Msg: msg.NOTSUCCESS,
    });
  }
};
  



//Logout data
exports.logout = async (req, res) => {
  try {
    const userId = req.currentUser;
    let user = await User.findById(userId);
      await User.findByIdAndUpdate(userId, { $set: { token: "" } }, { useFindAndModify: false });
      return res.status(200).json({
        status: 200,
        Msg: msg.LOGOUT,
      });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: 400,
      message: error.message,
    });
  }
};




//otp forgot password reset using mail
  exports.forgotpassword = async (req, res) => {
      const { email } = req.body;
      try {
        const otp = Math.floor(Math.random() * 10000);
        const otpExpiration = new Date(Date.now() + 2 * 60 * 1000);
    
        const otpExpirationIST = otpExpiration.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        });
    
        const user = await User.findOneAndUpdate(
          { email },
          { $set: { otp: otp, otpExpiration: otpExpirationIST } },
          { new: true }
        );
    
        if (!user) {
          return res.status(404).json({
            status: 404,
            message: msg.NOTFOUND,
          });
        } else {
          if (user) {
            await user.save();
          }
    
          const transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
              user: "e5fb579610d66e",
              pass: "7865d0f7419ac6",
            },
          });
        
          const mailOptions = {
            from: "e5fb579610d66e",
            to: email,
            subject: "Reset Password",
            text: `Your OTP for password reset is: ${otp}`,
          };
    
          await transporter.sendMail(mailOptions);
            res.status(200).json({
              status: 200,
              message: msg.MAILSEND,
          });
        }
      } catch (error) {
        console.log("Error sending OTP:", error);
        return res.status(500).json({
          status: 500,
          message: msg.INTERROR,
        });
      }
  };



//Reset password  
exports.Resetpassword = async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (!passwordvalidation(password)) {
    return res.status(400).json({
      status: 400,
      message:msg.PASSWORDVALID,
    });
  } 
  else{
  try {
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: msg.NOTFOUND,
      });
    } else {
      if (password !== confirmPassword) {
        return res.status(400).json({
          status: 400,
          message: msg.PASSNOTMATCH,
        });
      }
      else if (
        user.otpExpiration <
        new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })
      ) {
        return res.status(400).json({
          status: 400,
          message: msg.SESSONOUT,
        });
      }
      else {
        const hashedPassword = await passwordencrypt(password);

        user.password = hashedPassword;
        await user.save();

        return res.status(201).json({
          status: 201,
          message: msg.PASSRESTSUCC,
        });
      }
    }
  } catch (error) {
    console.log("Error resetting password:", error);
    return res.status(500).json({
      status: 500,
      message: msg.INTERROR,
    });
  }
}
};



// profile update
exports.updateProfile = async (req, res) => {
  try {
    const _id = req.params.id;
    const user = await User.findById(_id);

    if (!user) {
      return res.status(400).json({
        status: 400,
        Msg: msg.NOTFOUND,
      });
    } else {
      if (req.files && req.files.profile) {
        const profileUrl = `${frontEndUrl}/profile/${req.files.profile[0].filename}`;

        await User.findByIdAndUpdate(_id, { $set: { profile: profileUrl } }, { useFindAndModify: false });
        return res.status(200).json({
          status: 200,
          Msg: msg.PROUPDSUCC,
          profileUrl,
        });
      } else {
        return res.status(400).json({
          status: 400,
          Msg: msg.UPLOAD,
        });
      }
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(400).json({
      status: 400,
      Msg: msg.ERROR2,
    });
  }
};