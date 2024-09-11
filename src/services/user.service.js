const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//get all users
exports.registerUser = async (req, res) => {
  try {
    const user = new User(req.body);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();
    res.status(201).send({ user });
  } catch (error) {
    res.status(400).send(error);
  }
};

//login a user
exports.loginUser = async (req, res) => {
  try {
    console.log(req.body);
    const user = await User.findOne({ name: req.body.name });

    if (!user) {
      return res.status(400).send({ message: 'User not found' });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(400).send({ message: 'Invalid password' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    console.log(token);
    res.status(200).send({ token, name: user.name });
  } catch (error) {
    res.status(400).send(error);
  }
};

//login a user
