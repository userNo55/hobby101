// /api/createPayment.js
import { YooCheckout } from '@a2seven/yoo-checkout';
import Cors from 'cors';

// Инициализируем CORS для обработки запросов из приложения
const cors = Cors({ methods: ['POST'] });

// Вспомогательная функция для запуска CORS
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

// Настройте ЮKassa. ВАЖНО: используйте переменные окружения Vercel для ключей!
const checkout = new YooCheckout({
  shopId: process.env.YOOKASSA_SHOP_ID,
  secretKey: process.env.YOOKASSA_SECRET_KEY,
});

// Главная функция, которая будет вызвана Vercel
export default async function handler(req, res) {
  // Разрешаем запросы только с вашего домена приложения (для безопасности)
  await runMiddleware(req, res, cors);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешен' });
  }

  try {
    const { userId } = req.body; // ID пользователя из вашего приложения

    // 1. Создаем уникальный ID заказа
    const idempotenceKey = `hobby101-${userId}-${Date.now()}`;

    // 2. Формируем данные для платежа (350 руб.)
    const createPayload = {
      amount: {
        value: '350.00',
        currency: 'RUB',
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        // Куда вернуть пользователя после оплаты (обратно в приложение)
        return_url: `hobby101://home?payment=success`, // Ваш deeplink из app.js
      },
      description: 'Доступ ко всем проектам «Хобби 101»',
      // ОПЦИОНАЛЬНО: Укажите адрес для уведомлений от ЮKassa (см. Шаг 3)
      // Например: https://ваш-проект.vercel.app/api/webhook
    };

    // 3. Запрашиваем у ЮKassa платежную ссылку
    const payment = await checkout.createPayment(createPayload, idempotenceKey);

    // 4. Возвращаем ссылку в приложение
    res.status(200).json({
      success: true,
      paymentUrl: payment.confirmation.confirmation_url,
      paymentId: payment.id,
    });

  } catch (error) {
    console.error('Ошибка создания платежа:', error);
    res.status(500).json({ error: 'Не удалось создать платеж' });
  }
}