const mongoose = require("mongoose");
require('dotenv').config(); 

/* Storing MongoDB URI in an environment variable
*/
const URI = process.env.MONGODB_URI;

const connectDB = async () => {
  try {

/* Removed con variable
Fixes this issue: Remove this useless assignment to variable "con". (https://sonarcloud.io/project/issues?open=AZaZzF51xttRV5zrRk84&id=charlizeaponte_SQFinal)
and Remove the declaration of the unused 'con' variable. (https://sonarcloud.io/project/issues?open=AZaZzF51xttRV5zrRk83&id=charlizeaponte_SQFinal)
for maintainability
*/
    await mongoose.connect(URI);
    console.log("DB Connected Successfully ✅");
  } 
  /* Making the error clear by changing it from err to error.
  Also changing the console.log() to console.error()
  Fixes this issue: Handle this exception or don't catch it at all. (https://sonarcloud.io/project/issues?open=AZaZzF51xttRV5zrRk85&id=charlizeaponte_SQFinal)

  */
  catch (error) {
    console.error(`Authentication to database failed ❗`, error);
    process.exit(1);
  }
};

module.exports = connectDB;
