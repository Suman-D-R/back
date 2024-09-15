const Market = require('../models/market.model');
const Category = require('../models/categories.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');
const MarketPrice = require('../models/marketPrice.model');
const LatestMarketPrice = require('../models/latestMarketPrice.model');
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const upload = require('./uploadService');

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
      success: true,
      place: req.body.place,
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
      name: req.body.name,
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
    const { name, categoryId, baseUnit } = req.body;
    const imageUrl = req.file ? req.file.location : null;
    console.log(name);
    if (!name || !categoryId || !imageUrl) {
      return res.status(400).json({
        error: 'Product name, categoryId, and image are required',
      });
    }

    // Ensure categoryId is an array, even if a single categoryId is provided
    const categoryIdArray = Array.isArray(categoryId)
      ? categoryId
      : [categoryId];

    // Validate that categoryId is an array of valid ObjectIds
    if (!categoryIdArray.every((id) => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ error: 'Invalid categoryId(s)' });
    }

    try {
      // Create and save the product with multiple categories
      const product = new Product({
        name,
        categoryId: categoryIdArray,
        imageURL: imageUrl,
        baseUnit: baseUnit,
      });

      await product.save();
      res.status(201).json({ product });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } catch (error) {
    console.error('Error in addProduct:', error);
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
      latestPrice: lp.price,
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
    const { productId, marketId, price } = req.body;

    if (!marketId) {
      return res.status(400).json({ error: 'MarketId is required' });
    }

    // Validate required fields
    if (!productId || !price) {
      return res
        .status(400)
        .json({ error: 'productId and price are required' });
    }

    // Validate that productId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid productId' });
    }

    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Create and save the market price
    const marketPrice = new MarketPrice({
      productId,
      marketId,
      price,
    });

    await marketPrice.save();

    // Update or create the latest market price
    const existingLatestPrice = await LatestMarketPrice.findOne({
      marketId,
      productId,
    });

    if (existingLatestPrice) {
      // If a record exists, update it
      if (existingLatestPrice.price !== price) {
        existingLatestPrice.previousPrice = existingLatestPrice.price;
        existingLatestPrice.price = price;
        existingLatestPrice.updatedAt = Date.now();
        await existingLatestPrice.save();
      }
      latestPrice = existingLatestPrice;
    } else {
      // If no record exists, create a new one
      latestPrice = new LatestMarketPrice({
        marketId,
        productId,
        price,
        previousPrice: price,
        updatedAt: Date.now(),
      });
      await latestPrice.save();
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
          products: products,
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
    currentPrice: lp.price,
  }));
}

//get product price in all markets
exports.getProductPriceInAllMarkets = async (req, res) => {
  try {
    // Get all products
    const products = await Product.find().lean();

    // Get all latest market prices
    const latestPrices = await LatestMarketPrice.find()
      .populate('marketId')
      .populate('productId')
      .lean();

    // Group prices by product
    const productPrices = products.map((product) => {
      const prices = latestPrices.filter(
        (price) => price.productId._id.toString() === product._id.toString()
      );

      const marketPrices = prices.map((price) => ({
        _id: price.marketId._id,
        marketName: price.marketId.place,
        price: price.price,
        previousPrice: price.previousPrice,
        updatedAt: price.updatedAt,
        baseUnit: price.baseUnit,
      }));

      return {
        product: {
          _id: product._id,
          name: product.name,
          imageURL: product.imageURL,
          baseUnit: product.baseUnit,
        },
        marketPrices,
      };
    });

    res.status(200).json({ productPrices });
  } catch (error) {
    console.error('Error in getProductPriceInAllMarkets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//get price history of a product by market
exports.getPriceHistory = async (req, res) => {
  try {
    const marketId = req.params.marketId;
    const productId = req.query.productId;

    // console.log(marketId, productId);

    if (!marketId && !productId) {
      return res
        .status(400)
        .json({ error: 'MarketId or ProductId are required' });
    }

    const product = await Product.findById(productId);

    const prices = await MarketPrice.find({
      marketId: mongoose.Types.ObjectId(marketId),
      productId: mongoose.Types.ObjectId(productId),
    }).lean();

    res.status(200).json({ prices, product });
  } catch (error) {
    console.error('Error in getPriceHistory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//delete a market
exports.deleteMarket = async (req, res) => {
  try {
    const marketId = req.params.marketId;
    await Market.findByIdAndDelete(marketId);
    res.status(200).json({ message: 'Market deleted successfully' });
  } catch (error) {
    console.error('Error in deleteMarket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    await Product.findByIdAndDelete(productId);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
