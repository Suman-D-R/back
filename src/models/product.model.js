const { Schema, model } = require('mongoose');

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    categoryId: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Categories'
      }
    ],
    baseUnit: {
      type: String,
      required: true,
      enum: ['kg', 'liter', 'piece', 'dozen'],
      default: 'kg'
    },
    imageURL: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = model('Product', ProductSchema);
