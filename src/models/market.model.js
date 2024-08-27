const { Schema, model } = require('mongoose');

const marketSchema = new Schema(
  {
    place: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true,
      default: 'RMC'
    }
  },
  {
    timestamps: true
  }
);

module.exports = model('Market', marketSchema);
