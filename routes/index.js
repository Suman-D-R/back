const express = require('express');
const router = express.Router();

const userRoute = require('./user.route');
const marketRoute = require('./market.route');

const routes = () => {
  router.get('/', (req, res) => {
    res.json('Welcome');
  });
  router.use('/users', userRoute);
  router.use('/markets', marketRoute);

  return router;
};

module.exports = routes;
