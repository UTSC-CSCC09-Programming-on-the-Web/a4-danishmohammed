import express from "express";
import bodyParser from "body-parser";
import path from "path";
import session from "express-session";
import { sequelize } from "./datasource.js";
import { imagesRouter } from "./routers/images_router.js";
import { commentsRouter } from "./routers/comments_router.js";
import { usersRouter } from "./routers/users_router.js";

import { User } from "./models/user.js";
import { Image } from "./models/image.js";
import { Comment } from "./models/comment.js";

User.hasMany(Image);
Image.belongsTo(User);

User.hasMany(Comment);
Comment.belongsTo(User);

Image.hasMany(Comment);
Comment.belongsTo(Image);

export const app = express();
const PORT = 3000;

app.use(
  session({
    secret: process.env.SECRET_KEY || "secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("static"));

app.use("/api/images", imagesRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/users", usersRouter);

try {
  await sequelize.authenticate();
  await sequelize.sync({ alter: { drop: false } });
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

app.use(function (req, res, next) {
  console.log("HTTP request", req.method, req.url, req.body);
  next();
});

app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
