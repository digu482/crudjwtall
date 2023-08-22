const responseMessage = require('../utils/ResponseMessage.json')
const { JWT_SECRET} = process.env;

const jwtResponse = async function jwtResponse() {
  try {
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(400).json({
            status:400, 
            message:responseMessage.INVLIDEXP 
          });
        }
      });
      console.log("ssecure");
  } catch (error) {
          console.log('Error encrypting password:', error);
          throw error;
  }
}
module.exports = jwtResponse