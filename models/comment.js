// models/comment.js

import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";

export const Comment = sequelize.define("Comment", {
  author: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});
