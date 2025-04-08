require('dotenv').config(); 
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Конфигурация
const NP_API_KEY = process.env.NP_API_KEY; // API-ключ NOW Payments
const NP_IPN_SECRET = process.env.NP_IPN_SECRET; // Секрет для проверки IPN
const DOWNLOAD_URL = process.env.DOWNLOAD_URL; // URL сайта-конструктора
const CANCEL_URL = process.env.CANCEL_URL;

// Создание платежа
app.get('/create-payment', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.nowpayments.io/v1/invoice',
      {
        price_amount: 9.99,
        price_currency: 'usd',
        order_id: `ORDER_${Date.now()}`,
        success_url: DOWNLOAD_URL,
        cancel_url: CANCEL_URL,
      },
      {
        headers: {
          'x-api-key': NP_API_KEY,
        },
      }
    );
    
    res.redirect(response.data.invoice_url);
  } catch (error) {
    console.error('Payment error:', error.response?.data || error.message);
    res.redirect(DOWNLOAD_URL + '?status=error');
  }
});

// Обработка IPN Callback
app.post('/ipn', (req, res) => {
  const signature = req.headers['x-nowpayments-sig'];
  const payload = req.body;

  // Проверка подписи
  const expectedSignature = crypto
    .createHmac('sha512', NP_IPN_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(403).send('Invalid signature');
  }

  // Логируем данные (можно сохранять в базу)
  console.log('IPN received:', payload);
  res.sendStatus(200);
});

// Проверка статуса платежа (опционально)
app.get('/status/:paymentId', (req, res) => {
  const paymentId = req.params.paymentId;
  // Здесь можно добавить запрос к NOW Payments API
  res.json({ status: 'pending' });
});

// Эндпоинт для пинга (чтобы сервер не "засыпал")
app.get('/ping', (req, res) => {
  res.send('OK');
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});