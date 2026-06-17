const express = require('express');
const Account = require('../models/Account');
const router = express.Router();

const findAccount = async (cardNumber) => {
  const account = await Account.findOne({ cardNumber });
  if (!account) throw new Error('Account not found');
  return account;
};

router.post('/insert', async (req, res) => {
  const { cardNumber } = req.body;
  try {
    const account = await findAccount(cardNumber);
    res.json({ success: true, account: { cardNumber, balance: account.balance } });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

router.post('/verify-pin', async (req, res) => {
  const { cardNumber, pin } = req.body;
  try {
    const account = await findAccount(cardNumber);
    if (account.pin !== pin) throw new Error('Invalid PIN');
    res.json({ success: true, message: 'PIN verified' });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
});

router.get('/balance/:cardNumber', async (req, res) => {
  try {
    const account = await findAccount(req.params.cardNumber);
    res.json({ success: true, balance: account.balance });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

router.post('/withdraw', async (req, res) => {
  const { cardNumber, amount } = req.body;
  try {
    const account = await findAccount(cardNumber);
    if (account.balance < amount) throw new Error('Insufficient balance');
    account.balance -= amount;
    account.transactions.push({ type: 'withdraw', amount });
    await account.save();
    res.json({ success: true, newBalance: account.balance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/deposit', async (req, res) => {
  const { cardNumber, amount } = req.body;
  try {
    const account = await findAccount(cardNumber);
    account.balance += amount;
    account.transactions.push({ type: 'deposit', amount });
    await account.save();
    res.json({ success: true, newBalance: account.balance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/history/:cardNumber', async (req, res) => {
  try {
    const account = await findAccount(req.params.cardNumber);
    res.json({ success: true, transactions: account.transactions });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

// ✅ NEW: Register a new card
router.post('/register', async (req, res) => {
  const { cardNumber, pin } = req.body;
  try {
    // Check if card already exists
    const existing = await Account.findOne({ cardNumber });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Card already exists' });
    }
    // Create new account with 0 balance
    const newAccount = new Account({
      cardNumber,
      pin,
      balance: 0,
      transactions: []
    });
    await newAccount.save();
    res.json({ success: true, message: 'Account created' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;