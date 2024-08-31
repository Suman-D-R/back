const mongoose = require('mongoose');

const database = async () => {
  try {
    const DATABASE = process.env.DATABASE;

    await mongoose.connect(DATABASE, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to the database.');
  } catch (error) {
    console.log('Could not connect to the database.', error);
  }
};
module.exports = database;
