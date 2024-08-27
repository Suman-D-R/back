const express = require('express');
const userSerive = require('../services/user.service');

const router = express.Router();

//route to get all users
router.post('/register', userSerive.registerUser);

module.exports = router;
