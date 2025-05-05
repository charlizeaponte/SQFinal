const express = require("express");
const connectDB = require("./src/configs/db");
const cors = require("cors");
const userRoute = require("./src/routes/userRoute");
const articleRoute = require("./src/routes/articleRoute");
const commentRoute = require("./src/routes/commentRoute");
require('dotenv').config(); 
const PORT = 8000;
const app = express();
connectDB();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/user", userRoute);
app.use("/api/article", articleRoute);
app.use("/api/comment", commentRoute);
/* Made the method safer and not injecting data into html
Fixed issue: Change this code to not reflect user-controlled data (https://sonarcloud.io/project/issues?open=AZaZzF54xttRV5zrRk88&id=charlizeaponte_SQFinal)
 */
app.use("/", (req, res) => {
  const method = req.method;
  const path = req.path;
  const message = `${method} Route ${path} not found !`;
  res.status(404).send(message); 
});
app.listen(PORT, () => {
  console.log(`server run on port ${PORT} ✅`);
});
