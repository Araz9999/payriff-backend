require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const MERCHANT_ID = process.env.MERCHANT_ID;
const SECRET_KEY = process.env.SECRET_KEY;
const API_URL = 'https://api.payriff.com/api/v2/invoices';

app.get('/pay', async (req, res) => {
  const amount = Number(req.query.amount) || 1; // Decimal məbləğ (məs. 5 AZN)
  const desc = req.query.desc || 'Test';
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const payload = {
    merchant: MERCHANT_ID,
    body: {
      amount,
      currencyType: 'AZN',
      description: desc,
      languageType: 'AZ',
      approveURL: `${baseUrl}/ok`,
      cancelURL: `${baseUrl}/cancel`,
      declineURL: `${baseUrl}/decline`,
      sendEmail: true // Müşteriyə email göndər (opsiyonal)
    }
  };
  try {
    const { data } = await axios.post(API_URL, payload, {
      headers: { Authorization: SECRET_KEY }
    });
    if (data.code === '00000') {
      res.redirect(data.payload.paymentUrl);
    } else {
      res.status(400).send('API xətası: ' + (data.message || 'Naməlum xəta'));
    }
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

app.get('/cancel', (req, res) => res.send(`
  <html><body style="font-family:sans-serif;text-align:center;padding-top:40px;">
  <h1 style="color:orange;">❌ Ödəniş ləğv edildi!</h1>
  </body></html>`));

app.get('/decline', (req, res) => res.send(`
  <html><body style="font-family:sans-serif;text-align:center;padding-top:40px;">
  <h1 style="color:red;">❌ Ödəniş rədd edildi!</h1>
  </body></html>`));

- module.exports = app;
+ module.exports = (req, res) => app(req, res);
