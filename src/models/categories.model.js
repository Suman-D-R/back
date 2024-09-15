const { Schema, model } = require('mongoose');

const CategoriesSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ['vegetables', 'fruit'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model('Categories', CategoriesSchema);
