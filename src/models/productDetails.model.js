const { Schema, model } = require('mongoose');

const productDetailsSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantityFrom: {
    type: Number,
    required: true,
  },
  quantityTo: {
    type: Number,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  images: [
    {
      type: String,
      required: true,
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  isSeller: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model('ProductDetails', productDetailsSchema);
