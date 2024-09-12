const express = require('express');
const userSerive = require('../services/user.service');
const { newUserValidator } = require('../validators/user.validator');
const { userAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

//route to register a new user
router.post('/register', newUserValidator, userSerive.registerUser);

//route to login a user
router.post('/login', userSerive.loginUser);

//route to edit a user
router.put('/edit', userAuth, userSerive.editUser);

module.exports = router;
