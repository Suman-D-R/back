const mongoose = require('mongoose');

const latestMarketPriceSchema = new mongoose.Schema({
  marketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Market',
    required: true,
  },
  marketProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketProduct',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  previousPrice: {
    type: Number,
    default: null,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

latestMarketPriceSchema.index({ marketId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('LatestMarketPrice', latestMarketPriceSchema);
