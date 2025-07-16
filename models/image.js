// models/image.js

import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";

export const Image = sequelize.define("Image", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  file: {
    type: DataTypes.JSON,
    allowNull: false,
  },
});
