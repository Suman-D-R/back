const Market = require('../models/market.model');
const Category = require('../models/categories.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');
const MarketPrice = require('../models/marketPrice.model');
const LatestMarketPrice = require('../models/latestMarketPrice.model');

//get all markets
exports.getAllMarkets = async (req, res) => {
  try {
    const markets = await Market.find();
    res.status(200).send({ markets });
  } catch (error) {
    res.status(400).send(error);
  }
};

//add a new market data
exports.addMarket = async (req, res) => {
  try {
    if (!req.body.place) {
      return res.status(400).send({ error: 'Place name is required' });
    }
    const marketExist = await Market.findOne({ place: req.body.place });

    if (marketExist) {
      return res.status(400).send({ error: 'Market already exist' });
    }
    const market = new Market({
      place: req.body.place
    });
    await market.save();
    res.status(201).send({ market });
  } catch (error) {
    res.status(400).send(error);
  }
};

//get all markets
exports.getAllMarkets = async (req, res) => {
  try {
    const markets = await Market.find();
    res.status(200).send({ markets });
  } catch (error) {
    res.status(400).send(error);
  }
};

//add category
exports.addCategory = async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).send({ error: 'Category name is required' });
    }
    const category = new Category({
      name: req.body.name
    });
    await category.save();
    res.status(201).send({ category });
  } catch (error) {
    res.status(400).send(error);
  }
};

//get categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).send({ categories });
  } catch (error) {
    res.status(400).send(error);
  }
};

// Add product function
exports.addProduct = async (req, res) => {
  try {
    const { name, categoryId, imageURL } = req.body;

    // Validate required fields
    if (!name || !categoryId || !imageURL) {
      return res
        .status(400)
        .json({ error: 'Product name, categoryId, and imageURL are required' });
    }

    // Ensure categoryId is an array, even if a single categoryId is provided
    const categoryIdArray = Array.isArray(categoryId)
      ? categoryId
      : [categoryId];

    // Validate that categoryId is an array of valid ObjectIds
    if (!categoryIdArray.every((id) => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ error: 'Invalid categoryId(s)' });
    }

    // Create and save the product with multiple categories
    const product = new Product({
      name,
      categoryId: categoryIdArray,
      imageURL
    });

    await product.save();
    res.status(201).json({ product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//get market by name
exports.getMarketByName = async (req, res) => {
  try {
    const market = await Market.findOne({ place: req.params.name });
    if (!market) {
      return res.status(404).send({ error: 'Market not found' });
    }

    const latestPrices = await LatestMarketPrice.find({ marketId: market._id })
      .populate('productId')
      .lean();

    const products = latestPrices.map((lp) => ({
      product: lp.productId,
      latestPrice: lp.price
    }));

    res.status(200).send({ market, products });
  } catch (error) {
    console.error('Error in getMarketByName:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
};

// Add product price in market
exports.addProductPrice = async (req, res) => {
  try {
    const { productId, marketName, price } = req.body;
    const marketObj = await Market.findOne({ place: marketName });

    if (!marketObj._id) {
      return res.status(400).json({ error: 'market not found' });
    }
    // Validate required fields
    if (!productId || !price) {
      return res
        .status(400)
        .json({ error: 'productId, marketId, and price are required' });
    }

    // Validate that productId and marketId are valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid productId or marketId' });
    }

    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if the market exists
    const market = await Market.findById(marketObj._id);
    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    // Create and save the market price
    const marketPrice = new MarketPrice({
      productId,
      marketId: marketObj._id,
      price
    });

    await marketPrice.save();

    // Update or create the latest market price
    const latestPrice = await LatestMarketPrice.findOneAndUpdate(
      { marketId: marketObj._id, productId },
      {
        $set: { price, updatedAt: Date.now() },
        $setOnInsert: { previousPrice: null }
      },
      { upsert: true, new: true, runValidators: true }
    );

    if (latestPrice.previousPrice === null) {
      latestPrice.previousPrice = price;
      await latestPrice.save();
    } else if (latestPrice.previousPrice !== price) {
      await LatestMarketPrice.updateOne(
        { _id: latestPrice._id },
        { $set: { previousPrice: latestPrice.previousPrice } }
      );
    }

    res.status(201).json({ marketPrice, latestPrice });
  } catch (error) {
    console.error('Error while adding market price:', error);
    res.status(500).json({ error: error.message });
  }
};

//get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).send({ products });
  } catch (error) {
    res.status(400).send(error);
  }
};

// get all market products
exports.getAllMarketProducts = async (req, res) => {
  try {
    const markets = await Market.find();

    const marketProducts = await Promise.all(
      markets.map(async (market) => {
        const latestPrices = await fetchLatestMarketPrices(market._id);
        const products = processLatestMarketPrices(latestPrices);

        return {
          market: market,
          products: products
        };
      })
    );

    res.status(200).json({ marketProducts });
  } catch (error) {
    console.error('Error in getAllMarketProducts:', error);
    res.status(500).json({ error: error.message });
  }
};

async function fetchLatestMarketPrices(marketId) {
  try {
    return await LatestMarketPrice.find({ marketId })
      .populate('productId')
      .lean();
  } catch (error) {
    console.error(
      `Error fetching latest prices for market ${marketId}:`,
      error
    );
    return [];
  }
}

function processLatestMarketPrices(latestPrices) {
  return latestPrices.map((lp) => ({
    product: lp.productId,
    currentPrice: lp.price
  }));
}
