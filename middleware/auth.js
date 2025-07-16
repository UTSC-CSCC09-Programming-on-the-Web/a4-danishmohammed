// middleware/auth.js

export const isAuthenticated = function (req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

export const isGalleryOwner = async function (req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const imageId = req.params.imageId;

  try {
    const { Image } = await import("../models/image.js");
    const image = await Image.findByPk(imageId);

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    if (image.UserId !== req.session.userId) {
      return res
        .status(403)
        .json({ error: "You do not have permission to perform this action" });
    }

    next();
  } catch (err) {
    console.error("Permission check error:", err);
    return res
      .status(500)
      .json({ error: "Server error while checking permissions" });
  }
};

export const canDeleteComment = async function (req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const commentId = req.params.commentId;

  try {
    const { Comment } = await import("../models/comment.js");
    const { Image } = await import("../models/image.js");

    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.UserId === req.session.userId) {
      return next();
    }

    const image = await Image.findByPk(comment.ImageId);
    if (image && image.UserId === req.session.userId) {
      return next();
    }

    return res
      .status(403)
      .json({ error: "You do not have permission to delete this comment" });
  } catch (err) {
    console.error("Permission check error:", err);
    return res
      .status(500)
      .json({ error: "Server error while checking permissions" });
  }
};
