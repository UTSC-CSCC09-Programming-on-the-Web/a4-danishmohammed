// routers/users_router.js

import { User } from "../models/user.js";
import { Router } from "express";
import bcrypt from "bcrypt";
import { isAuthenticated } from "../middleware/auth.js";

export const usersRouter = Router();
const saltRounds = 10;

usersRouter.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const existingUser = await User.findOne({
    where: {
      username: username,
    },
  });

  if (existingUser) {
    return res.status(409).json({ error: "Username already exists" });
  }

  const user = User.build({
    username: username,
  });

  const salt = bcrypt.genSaltSync(saltRounds);
  const hashedPassword = bcrypt.hashSync(password, salt);
  user.password = hashedPassword;

  try {
    await user.save();
  } catch (err) {
    console.error(err);
    return res.status(422).json({ error: "User creation failed." });
  }

  return res.status(201).json({
    username: user.username,
    id: user.id,
  });
});

usersRouter.post("/signin", async (req, res) => {
  const user = await User.findOne({
    where: {
      username: req.body.username,
    },
  });

  if (user === null) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  const hash = user.password;
  const password = req.body.password;

  if (!bcrypt.compareSync(password, hash)) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  req.session.userId = user.id;
  req.session.username = user.username;

  return res.json({
    username: user.username,
    id: user.id,
  });
});

usersRouter.get("/signout", function (req, res) {
  req.session.destroy();
  return res.json({ message: "Successfully signed out" });
});

usersRouter.get("/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = await User.findByPk(req.session.userId);

  if (!user) {
    req.session.destroy();
    return res.status(401).json({ error: "User not found" });
  }

  return res.json({
    username: user.username,
    id: user.id,
  });
});
