const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//get all users
exports.registerUser = async (req, res) => {
  try {
    const { name, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ name, password: hashedPassword });
    const savedUser = await user.save();
    res.status(201).send({ user: savedUser });
  } catch (error) {
    res.status(400).send(error);
  }
};

//login a user
exports.loginUser = async (req, res) => {
  try {
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

//edit a user
exports.editUser = async (req, res) => {
  try {
    const { name, password } = req.body;

    const user = await User.findByIdAndUpdate(
      req.data.id,
      { name },
      {
        new: true,
      }
    );
    res.status(200).send({ user });
  } catch (error) {
    res.status(400).send(error);
  }
};
