const express = require('express');
const marketService = require('../services/market.service');
const upload = require('../services/uploadService');

const router = express.Router();

//route to get all users
router.get('/', marketService.getAllMarkets);

//add a new market data
router.post('/addMarket', marketService.addMarket);

//get all market products
router.get('/allMarkets', marketService.getAllMarkets);

//get market by name
router.get('/marketByName/:name', marketService.getMarketByName);

//add category
router.post('/addCategory', marketService.addCategory);

//get categories
router.get('/categories', marketService.getCategories);

//add product
router.post('/addProduct', upload.single('image'), marketService.addProduct);

//get all products
router.get('/products', marketService.getProducts);

//add product price in market
router.post('/addProductPrice', marketService.addProductPrice);

//get all market products
router.get('/allMarketProducts', marketService.getAllMarketProducts);

//get product price in all markets
router.get(
  '/productPriceInAllMarkets',
  marketService.getProductPriceInAllMarkets
);

//get price history of a product by market
router.get('/priceHistory/:marketId', marketService.getPriceHistory);

//delete a market
router.delete('/deleteMarket/:marketId', marketService.deleteMarket);

//delete a product
router.delete('/deleteProduct/:productId', marketService.deleteProduct);

//get all price by particular market product
router.get(
  '/allPriceByMarketProduct/:marketProductId',
  marketService.getAllPriceByMarketProduct
);

//delete a market product price
router.delete(
  '/deleteMarketProductPrice/:marketProductPriceId',
  marketService.deleteMarketProductPrice
);

//update a market product price
router.put(
  '/updateMarketProductPrice/:marketProductPriceId',
  marketService.updateMarketProductPrice
);

module.exports = router;
