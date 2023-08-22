const express = require('express')
const admin = require("../model/admin")
const bcrypt = require("bcrypt")
const {passwordencrypt} = require("../services/commonservice")
const {passwordvalidation} = require("../services/commonservice")
const {admingenerateJwt} = require("../utils/jwt")
const {adminverifyToken} = require("../middleware/Auth")
const jwt = require("jsonwebtoken");
const msg = require("../utils/ResponseMessage.json")
require("dotenv").config();
const User = require("../model/user")
const transporter = require("../config/Emailconfig") 
const nodemailer = require('nodemailer');
const uploadFile = require("../middleware/upload")


// admin create
exports.createAdmin = async (req, res) => {
  try {
    const password = await passwordencrypt(req.body.password);
    const adminData = new admin({
      adminName: req.body.adminName,
      email: req.body.email,
      mobile: req.body.mobile,
      password: password,
    });
    adminData.save();
    res.status(201).json({
      status:201,
      success: true,
      Msg:msg. CREATE
    });
  } catch (error) {
    res.status(400).json({
      status:400,
      success: false,
      msg: error.message,
    });
  }
};




// admin login
exports.adminLogin = async (req, res) => {
  try {
    let {adminName, email, mobile, password ,_id} = req.body;
    let adminlogin = await admin.findOne({$or: [ { email },{ mobile }, ],});

if (!adminlogin) {
  return res.status(404).json({
    status:404,
    error: true,
    message: msg.NOTFOUND,
  });
} else {
  if (adminlogin.isdelete) {
    return res.status(400).json({
      status:400,
      error: true,
      message: msg.ISDELETE,
    });
  } else {
    const isvalid = await bcrypt.compare(password, adminlogin.password);
    if (!isvalid) {
      return res.status(400).json({
        status:400,
        error: true,
        message: msg.NOTMATCH,
      });
    } else {
      const { error, token } = await admingenerateJwt(adminlogin._id);
      if (error) {
        return res.status(400).json({
          status:400,
          error: true,
          message: msg.TOKEN,
        });
      } else {
        await admin.findOneAndUpdate({ _id: adminlogin._id }, { $set: { token: token } }, { useFindAndModify: false });
        return res.status(200).json({
          status:200,
          success: true,
          token: token,
          adminlogin:email,
          message: msg.SUCCESS1,
        });
      }
    }
  }
}
} catch (err) {
return res.status(400).json({
  status:400,
  error: true,
  message: msg.NOTSUCCESS,
});
}
};




//admin logout
exports.logout = async (req, res) => {
  try {
    const adminId = req.currentadmin;
    let adminData = await admin.findById(adminId);
      await admin.findByIdAndUpdate(adminId, { $set: { token: "" } }, { useFindAndModify: false });
      return res.status(200).json({
        status:200, 
        message: msg.LOGOUT1 
      });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: 400,
      message: error.message,
    });
  }
};




//admin change password
exports.adminchangepassword = async (req, res) => {
  const { email, currentPassword, newPassword, confirmPassword } = req.body;
  try {
    const user = await admin.findOne({ email });
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
            await admin.updateOne({ _id: user._id },{ $set: { password: hashedPassword } }
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




//admin create user
exports.admincreateuser = async (req, res) => {
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
            status:400, 
            message: msg.NOTCREATE 
          });
        } else {
          return res.status(201).json({
            status:201, 
            message: msg.CREATE,
            data: data,
          });
        }
      });
    } else { 
      return res.status(400).json({
        status:400, 
        auth: false, 
        Msg: msg.EXIST  
      });
    }
  } catch (error) {
    console.log(error);
  }
};




//admin find all user
exports.adminfindalluser = async (req, res) => {
  try {
    let userdata = await User.find();
    if (!userdata) {
      return res.status(400).json({
        status:400,
        error: true,
        message: msg.NOTFOUND,
      });
    }else{
      res.status(200).json({
        status:200,
        userdata,
        Msg: msg.LOGIN,
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




//admin delete user
exports.admindeleteuser = async (req, res) => {
  try {
    const {_id} = req.body;
    let user = await User.findByIdAndUpdate({_id});
    if (!user) {
      return res.status(404).json({
        status:404, 
        message: msg.NOTFOUND 
      });
    }else {
      user.isdelete = true;
      await user.save();
    }
    return res.status(200).json({
      status:200, 
      message: msg.DELETE 
    });
  }catch (error) {
    console.log(error);
    res.status(400).json({
      status:400, 
      message: msg.ERROR1, 
    });
  }
};




// admin Reactive User 
exports.adminreactivateuser = async (req, res) => {
  try {
    const {_id} = req.body;
    let user = await User.findByIdAndUpdate({_id});
    if (!user) {
      return res.status(404).json({
        status:404, 
        message: msg.NOTFOUND 
      });
    } else {
      user.isdelete = false;
      await user.save();
      return res.status(200).json({
        status:200, 
        message: msg.REACTIVATE 
      });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      status:400, 
      message: msg.ERROR1,
    });
  }
};




//admin forgot password
exports.adminforgotpassword = async (req, res) => {
  const email = req.body.email;
  const user = await admin.findOne({ email });
  if (!user) {
    return res.status(404).json({
      status:404,
      message:msg.NOTFOUND1,
    });
  }else{
    const otp = Math.floor(Math.random() .toFixed(4)* 9999);
    await user.updateOne({ $set: { otp } });
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
      text: `Your OTP for password reset is: ${otp}`
    };
    transporter.sendMail(mailOptions, (err, data) => {
      if (err) {
        return res.status(400).json({
          status:400,
          message:msg.NOTSEND,
        });
      }else{
      res.status(200).json({
        status:200,
        Msg:msg.MAILSEND
      });
      }
    });
  }
};




//admin reset password
exports.adminResetpassword = async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  try {
    const user = await admin.findOne({ email });
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
      } else {
        const hashPassword = await passwordencrypt(password);
        await admin.findOneAndUpdate({ email }, { $set: { password: hashPassword } }, { useFindAndModify: false });
        return res.status(200).json({
          status: 200,
          message: msg.PASSRESTSUCC,
        });
      }
    }
  } catch (error) {
    console.log('Error resetting password:', error);
    return res.status(400).json({
      status:400,
      message: msg.ERROROCCURED,
    });
  }
};




//admin update user data
  exports.adminupdateuser = async (req, res) => {
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





  
  
  
  