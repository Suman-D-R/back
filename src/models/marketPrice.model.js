const { Schema, model } = require('mongoose');

const marketPriceSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Product'
    },
    marketId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Market'
    },
    price: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = model('MarketPrice', marketPriceSchema);
