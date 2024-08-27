const { Schema, model } = require('mongoose');

const CategoriesSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = model('Categories', CategoriesSchema);
