const Market = require('../models/market.model');
const Category = require('../models/categories.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');
const MarketPrice = require('../models/marketPrice.model');
const LatestMarketPrice = require('../models/latestMarketPrice.model');
const i18n = require('i18n');

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

    const savedMarketPrice = await marketPrice.save();

    console.log(savedMarketPrice);

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
        marketProductId: savedMarketPrice._id,
        price,
        previousPrice: price,
        updatedAt: Date.now(),
      });
      console.log(latestPrice);
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
    // Fetch language preference from query parameters or set a default
    const lang = req.query.lang || 'en';
    i18n.setLocale(lang);

    // Fetch all products from the database
    const products = await Product.find();

    // Translate product names
    const translatedProducts = products.map((product) => ({
      ...product.toObject(),
      name: i18n.__(
        `products.${product.name.toLowerCase().replace(/\s+/g, '')}`
      ), // Translate the name field using the key
    }));

    res.status(200).json({ products: translatedProducts });
  } catch (error) {
    console.error('Error while fetching products:', error);
    res.status(500).json({ error: error.message });
  }
};

// get all market products
exports.getAllMarketProducts = async (req, res) => {
  try {
    const lang = req.query.lang || 'en';
    i18n.setLocale(lang);

    const markets = await Market.find();

    const marketProducts = await Promise.all(
      markets.map(async (market) => {
        const latestPrices = await fetchLatestMarketPrices(market._id);
        const products = processLatestMarketPrices(latestPrices, lang);
        return {
          market: {
            ...market.toObject(),
            place: i18n.__(
              `markets.${market.place.toLowerCase().replace(/\s+/g, '')}`
            ),
          },
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

function processLatestMarketPrices(latestPrices, lang) {
  return latestPrices.map((lp) => ({
    product: {
      ...lp.productId,
      name: i18n.__(
        `products.${lp.productId.name.toLowerCase().replace(/\s+/g, '')}`
      ),
    },
    currentPrice: lp.price,
    date: lp.updatedAt,
  }));
}

//get product price in all markets
exports.getProductPriceInAllMarkets = async (req, res) => {
  try {
    // Get all products
    const lang = req.query.lang || 'en';
    i18n.setLocale(lang);

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
        marketName: i18n.__(
          `markets.${price.marketId.place.toLowerCase().replace(/\s+/g, '')}`
        ),
        price: price.price,
        previousPrice: price.previousPrice,
        updatedAt: price.updatedAt,
        baseUnit: price.baseUnit,
      }));

      return {
        product: {
          _id: product._id,
          name: i18n.__(
            `products.${product.name.toLowerCase().replace(/\s+/g, '')}`
          ),
          imageURL: product.imageURL,
          baseUnit: product.baseUnit,
          priority: product.priority,
          isInDemand: product.isInDemand,
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
    const lang = req.query.lang || 'en';
    i18n.setLocale(lang);

    // console.log(marketId, productId);

    if (!marketId && !productId) {
      return res
        .status(400)
        .json({ error: 'MarketId or ProductId are required' });
    }

    const product = await Product.findById(productId);

    product.name = i18n.__(
      `products.${product.name.toLowerCase().replace(/\s+/g, '')}`
    );

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

//get all price by particular market product
exports.getAllPriceByMarketProduct = async (req, res) => {
  try {
    const marketProductId = req.params.marketProductId;
    const productId = req.query.productId;
    const prices = await MarketPrice.find({
      marketId: mongoose.Types.ObjectId(marketProductId),
      productId: mongoose.Types.ObjectId(productId),
    });
    res.status(200).json({ prices });
  } catch (error) {
    // console.error('Error in getAllPriceByMarketProduct:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//delete a market product price
exports.deleteMarketProductPrice = async (req, res) => {
  try {
    const marketProductPriceId = req.params.marketProductPriceId;

    // Delete from MarketPrice
    const deletedPrice = await MarketPrice.findByIdAndDelete(
      marketProductPriceId
    );

    if (!deletedPrice) {
      return res.status(404).json({ error: 'Market product price not found' });
    }

    // Find the latest price for this product and market
    const latestPrice = await MarketPrice.findOne({
      productId: deletedPrice.productId,
      marketId: deletedPrice.marketId,
    }).sort({ createdAt: -1 });

    if (latestPrice) {
      // Update LatestMarketPrice with the new latest price
      await LatestMarketPrice.findOneAndUpdate(
        { productId: deletedPrice.productId, marketId: deletedPrice.marketId },
        {
          price: latestPrice.price,
          previousPrice: deletedPrice.price,
          updatedAt: Date.now(),
        },
        { new: true, upsert: true }
      );
    } else {
      // If no prices left, delete the LatestMarketPrice entry
      await LatestMarketPrice.findOneAndDelete({
        productId: deletedPrice.productId,
        marketId: deletedPrice.marketId,
      });
    }

    res
      .status(200)
      .json({ message: 'Market product price deleted successfully' });
  } catch (error) {
    console.error('Error in deleteMarketProductPrice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//update a market product price
exports.updateMarketProductPrice = async (req, res) => {
  try {
    const marketProductPriceId = req.params.marketProductPriceId;
    const { price } = req.body;

    // Update MarketPrice
    const updatedPrice = await MarketPrice.findByIdAndUpdate(
      marketProductPriceId,
      { price },
      { new: true }
    );

    if (!updatedPrice) {
      return res.status(404).json({ error: 'Market product price not found' });
    }

    // Update LatestMarketPrice
    const latestPrice = await LatestMarketPrice.findOneAndUpdate(
      { productId: updatedPrice.productId, marketId: updatedPrice.marketId },
      {
        price: price,
        previousPrice: updatedPrice.price,
        updatedAt: Date.now(),
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ updatedPrice, latestPrice });
  } catch (error) {
    console.error('Error in updateMarketProductPrice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//get product price in all markets by product id
exports.getProductPriceInAllMarketsByProductId = async (req, res) => {
  try {
    const productId = req.params.productId;
    // Fetch language preference from query parameters or set a default
    const lang = req.query.lang || 'en';
    i18n.setLocale(lang);

    // Fetch product data
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Fetch prices with market data
    const prices = await LatestMarketPrice.find({ productId })
      .populate('marketId', 'place')
      .lean();

    const pricesWithMarketData = prices.map((price) => ({
      _id: price._id,
      price: price.price,
      previousPrice: price.previousPrice,
      updatedAt: price.updatedAt,
      market: {
        _id: price.marketId._id,
        place: i18n.__(
          `markets.${price.marketId.place.toLowerCase().replace(/\s+/g, '')}`
        ),
      },
    }));

    res.status(200).json({
      product: {
        _id: product._id,
        name: i18n.__(
          `products.${product.name.toLowerCase().replace(/\s+/g, '')}`
        ), // Translate the product name
        imageURL: product.imageURL,
        baseUnit: product.baseUnit,
        categoryId: product.categoryId,
        priority: product.priority,
        isInDemand: product.isInDemand,
      },
      prices: pricesWithMarketData,
    });
  } catch (error) {
    console.error('Error in getProductPriceInAllMarketsByProductId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
