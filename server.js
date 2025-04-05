const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const app = express();
const port = 3000;
// Конфигурация
const CONSTRUCTOR_DOWNLOAD_URL = "https://solana.com/ru/wallets"; // Ваша страница загрузки
const CONSTRUCTOR_CANCEL_URL = "https://solana.com/ru/solutions/digital-assets"; // Ваша страница отмены
const NP_API_KEY = process.env.NP_API_KEY; // API-ключ из настроек NOW Payments
const NP_IPN_SECRET = process.env.NP_IPN_SECRET; // Секрет для подписи IPN
app.use(express.json());
// Эндпоинт для создания инвойса
app.get("/create-payment", async (req, res)=>{
  try {
    // Создаем инвойс
    const response = await axios.post("https://api.nowpayments.io/v1/invoice", {
      price_amount: 1.0,
      price_currency: "usd",
      order_id: `ORDER_${Date.now()}`,
      order_description: "Monk Mode Planner",
      success_url: CONSTRUCTOR_DOWNLOAD_URL,
      cancel_url: CONSTRUCTOR_CANCEL_URL
    }, {
      headers: {
        "x-api-key": NP_API_KEY
      }
    });
    // Перенаправляем пользователя на страницу оплаты
    res.redirect(response.data.invoice_url);
  } catch (error) {
    res.redirect(CONSTRUCTOR_DOWNLOAD_URL + "?status=error");
  }
});
// Эндпоинт для пинга
app.get("/ping", (req, res)=>{
  res.send("OK");
});
// Эндпоинт для IPN Callback
app.post("/ipn", (req, res)=>{
  const signature = req.headers["x-nowpayments-sig"];
  const payload = req.body;
  // Проверка подписи
  const expectedSignature = crypto.createHmac("sha512", NP_IPN_SECRET).update(JSON.stringify(payload)).digest("hex");
  if (signature !== expectedSignature) {
    return res.status(403).send("Invalid signature");
  }
  // Логируем данные (можно сохранять в базу)
  console.log("IPN received:", payload);
  res.sendStatus(200);
});
app.listen(port, ()=>{
  console.log(`Server running on port ${port}`);
});
