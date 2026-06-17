const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['withdraw', 'deposit'], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const accountSchema = new mongoose.Schema({
  cardNumber: { type: String, required: true, unique: true },
  pin: { type: String, required: true },
  balance: { type: Number, default: 0 },
  transactions: [transactionSchema],
});

module.exports = mongoose.model('Account', accountSchema);
