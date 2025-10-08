// api/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const MERCHANT_ID = process.env.MERCHANT_ID;
const SECRET_KEY = process.env.SECRET_KEY;
const API_URL = 'https://api.payriff.com/v1/createOrder';

function isValidPayriff(body, sentHash) {
  if (!sentHash) return false;
  const calc = crypto.createHash('sha256')
    .update(JSON.stringify(body) + SECRET_KEY).digest('hex');
  return calc === sentHash;
}

app.get('/pay', async (req, res) => {
  const amount = Math.round((Number(req.query.amount) || 100) * 100);
  const desc = req.query.desc || 'Test';
  const payload = {
    merchantId: MERCHANT_ID,
    amount,
    currency: 'AZN',
    description: desc,
    language: 'AZ',
    redirectUrl: `${req.protocol}://${req.get('host')}/ok`,
    callbackUrl: `${req.protocol}://${req.get('host')}/webhook`
  };
  try {
    const { data } = await axios.post(API_URL, payload, {
      headers: { Authorization: `Bearer ${SECRET_KEY}` }
    });
    res.redirect(data.payload.paymentUrl);
  } catch (e) {
    res.status(400).send('Sorğu xətası: ' + (e.response?.data?.message || e.message));
  }
});

app.get('/ok', (req, res) => res.send(`
  <html><body style="font-family:sans-serif;text-align:center;padding-top:40px;">
  <h1 style="color:green;">✅ Ödəniş uğurlu!</h1>
  <p>orderId: <b>${req.query.orderId || 'yoxdur'}</b></p>
  <button onclick="window.parent.postMessage({status:'paid'},'*')">Rork-a xəbər ver</button>
  </body></html>`));

app.post('/webhook', (req, res) => {
  const sentHash = req.headers['x-payriff-signature'];
  if (!isValidPayriff(req.body, sentHash)) {
    console.log('❌ Yalan webhook');
    return res.sendStatus(400);
  }
  console.log('✅ Webhook imza doğru:', req.body);
  res.sendStatus(200);
});

module.exports = app;
