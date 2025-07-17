// routers/comments_router.js

import { Router } from "express";
import { Comment } from "../models/comment.js";
import { Image } from "../models/image.js";
import { User } from "../models/user.js";
import { isAuthenticated, canDeleteComment } from "../middleware/auth.js";

export const commentsRouter = Router();

commentsRouter.get("/image/:imageId", isAuthenticated, async (req, res) => {
  const imageId = req.params.imageId;
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;

  if (isNaN(parseInt(imageId, 10))) {
    return res.status(422).json({ error: "Invalid image ID" });
  }

  if (req.query.page !== undefined && isNaN(parseInt(req.query.page, 10))) {
    return res.status(422).json({ error: "Page parameter must be a number" });
  }

  if (req.query.limit !== undefined && isNaN(parseInt(req.query.limit, 10))) {
    return res.status(422).json({ error: "Limit parameter must be a number" });
  }

  if (page < 0) {
    return res.status(422).json({ error: "Page must be non-negative" });
  }

  try {
    const image = await Image.findByPk(imageId);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }
    const { count, rows } = await Comment.findAndCountAll({
      where: { ImageId: imageId },
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: page * limit,
    });

    const formatted = rows.map((c) => ({
      commentId: c.id,
      imageId: c.ImageId,
      author: c.author,
      content: c.content,
      date: c.createdAt,
      userId: c.UserId,
    }));

    res.json({
      comments: formatted,
      totalCount: count,
      currentUserId: req.session.userId,
    });
  } catch (err) {
    console.error("Error getting comments:", err);
    res.status(500).json({ error: "Could not retrieve comments" });
  }
});

commentsRouter.post("/", isAuthenticated, async (req, res) => {
  const { imageId, content } = req.body;

  if (typeof content !== "string") {
    return res.status(422).json({ error: "Content must be a string" });
  }

  if (typeof imageId !== "number" && typeof imageId !== "string") {
    return res
      .status(422)
      .json({ error: "Image ID must be a number or string" });
  }

  if (isNaN(parseInt(imageId, 10))) {
    return res.status(422).json({ error: "Invalid image ID" });
  }

  if (!imageId || !content) {
    return res.status(422).json({ error: "Missing required fields" });
  }

  if (content.trim().length === 0) {
    return res.status(422).json({ error: "Content cannot be empty" });
  }

  try {
    const user = await User.findByPk(req.session.userId);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const image = await Image.findByPk(imageId);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    const comment = await Comment.create({
      ImageId: imageId,
      author: user.username,
      content,
      UserId: user.id,
    });

    res.status(201).json({
      commentId: comment.id,
      imageId: comment.ImageId,
      author: comment.author,
      content: comment.content,
      date: comment.createdAt,
      userId: comment.UserId,
    });
  } catch (err) {
    console.error("Error creating comment:", err);
    res.status(500).json({ error: "Could not add comment" });
  }
});

commentsRouter.delete("/:commentId", canDeleteComment, async (req, res) => {
  const commentId = req.params.commentId;

  if (isNaN(parseInt(commentId, 10))) {
    return res.status(422).json({ error: "Invalid comment ID" });
  }

  try {
    const comment = await Comment.findByPk(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const deletedCommentId = comment.id;
    await comment.destroy();

    res.json({
      success: true,
      commentId: deletedCommentId,
    });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: "Could not delete comment" });
  }
});
