// routers/images_router.js

import { Router } from "express";
import multer from "multer";
import path from "path";
import { Image } from "../models/image.js";
import { Comment } from "../models/comment.js";
import { User } from "../models/user.js";
import { isAuthenticated } from "../middleware/auth.js";

const upload = multer({ dest: "uploads/" });
export const imagesRouter = Router();

imagesRouter.get("/users", async (req, res) => {
  try {
    const allUsers = await User.findAll({
      attributes: ["id", "username"],
      order: [["username", "ASC"]],
    });

    res.json(allUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch users" });
  }
});

imagesRouter.post(
  "/",
  isAuthenticated,
  upload.single("image"),
  async (req, res) => {
    const { title } = req.body;
    const file = req.file;

    if (typeof title !== "string") {
      return res.status(422).json({ error: "Title must be a string" });
    }

    if (!title || !file) {
      return res.status(422).json({ error: "Missing title or image file" });
    }

    if (title.trim().length === 0) {
      return res.status(422).json({ error: "Title cannot be empty" });
    }

    try {
      const user = await User.findByPk(req.session.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const newImage = await Image.create({
        title,
        author: user.username,
        file: file,
        UserId: user.id,
      });

      res.status(201).json({
        imageId: newImage.id,
        title: newImage.title,
        author: newImage.author,
        url: `/api/images/${newImage.id}/file`,
        date: newImage.createdAt,
        userId: newImage.UserId,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Could not save image" });
    }
  }
);

imagesRouter.get("/count", async (req, res) => {
  try {
    const count = await Image.count();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Could not count images" });
  }
});

imagesRouter.get("/users/count", async (req, res) => {
  try {
    const count = await User.count();

    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Could not count users" });
  }
});

imagesRouter.get("/users/:userId/by-index/:index", async (req, res) => {
  const userId = req.params.userId;
  const index = parseInt(req.params.index, 10);

  if (isNaN(parseInt(userId, 10))) {
    return res.status(422).json({ error: "Invalid user ID" });
  }

  if (isNaN(index)) {
    return res.status(422).json({ error: "Invalid index parameter" });
  }

  if (index < 0) {
    return res.status(422).json({ error: "Index must be non-negative" });
  }

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const images = await Image.findAll({
      where: { UserId: userId },
      order: [["createdAt", "DESC"]],
    });

    if (index < 0 || index >= images.length) {
      return res.status(404).json({ error: "Index out of bounds" });
    }

    const image = images[index];

    res.json({
      imageId: image.id,
      title: image.title,
      author: image.author,
      url: `/api/images/${image.id}/file`,
      date: image.createdAt,
      userId: image.UserId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not retrieve image" });
  }
});

imagesRouter.get("/users/:userId/count", async (req, res) => {
  const userId = req.params.userId;

  if (isNaN(parseInt(userId, 10))) {
    return res.status(422).json({ error: "Invalid user ID" });
  }

  try {
    const count = await Image.count({
      where: {
        UserId: userId,
      },
    });

    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Could not count user images" });
  }
});

imagesRouter.get("/users/by-index/:index", async (req, res) => {
  const index = parseInt(req.params.index, 10);

  if (isNaN(index)) {
    return res.status(422).json({ error: "Invalid index parameter" });
  }

  if (index < 0) {
    return res.status(422).json({ error: "Index must be non-negative" });
  }

  try {
    const allUsers = await User.findAll({
      attributes: ["id", "username"],
      order: [["username", "ASC"]],
    });

    if (index < 0 || index >= allUsers.length) {
      return res.status(404).json({ error: "User index out of bounds" });
    }

    const user = allUsers[index];

    res.json({
      userId: user.id,
      username: user.username,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not retrieve user" });
  }
});

imagesRouter.get("/:id/file", async (req, res) => {
  const imageId = req.params.id;

  if (isNaN(parseInt(imageId, 10))) {
    return res.status(422).json({ error: "Invalid image ID" });
  }

  try {
    const image = await Image.findByPk(imageId);

    if (!image || !image.file) {
      return res.status(404).json({ error: "Image or file not found" });
    }

    res.setHeader("Content-Type", image.file.mimetype);
    res.sendFile(image.file.path, { root: path.resolve() });
  } catch (err) {
    res.status(500).json({ error: "Could not load image file" });
  }
});

imagesRouter.delete("/:imageId", isAuthenticated, async (req, res) => {
  const imageId = req.params.imageId;

  if (isNaN(parseInt(imageId, 10))) {
    return res.status(422).json({ error: "Invalid image ID" });
  }

  try {
    const image = await Image.findByPk(req.params.imageId);

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    if (image.UserId !== req.session.userId) {
      return res
        .status(403)
        .json({ error: "You can only delete your own images" });
    }

    await Comment.destroy({ where: { ImageId: req.params.imageId } });
    await image.destroy();

    res.json({
      success: true,
      imageId: req.params.imageId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete image" });
  }
});

imagesRouter.get("/by-index/:index", async (req, res) => {
  const index = parseInt(req.params.index, 10);

  if (isNaN(index)) {
    return res.status(422).json({ error: "Invalid index parameter" });
  }

  if (index < 0) {
    return res.status(422).json({ error: "Index must be non-negative" });
  }

  try {
    const images = await Image.findAll({ order: [["createdAt", "DESC"]] });

    if (index < 0 || index >= images.length) {
      return res.status(404).json({ error: "Index out of bounds" });
    }

    const image = images[index];

    res.json({
      imageId: image.id,
      title: image.title,
      author: image.author,
      url: `/api/images/${image.id}/file`,
      date: image.createdAt,
      userId: image.UserId,
    });
  } catch (err) {
    res.status(500).json({ error: "Could not retrieve image" });
  }
});
