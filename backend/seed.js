const Account = require('./models/Account');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Account.create({ cardNumber: '1234', pin: '1111', balance: 1000 });
  console.log('Test account created (card: 1234, pin: 1111)');
  process.exit();
});
