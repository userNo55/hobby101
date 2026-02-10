import { YooCheckout } from '@a2seven/yoo-checkout';
import Cors from 'cors';

// Настройка CORS - разрешаем запросы отовсюду для тестов
const cors = Cors({
  origin: '*', // Для продакшена замените на домен вашего приложения
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
});

// Вспомогательная функция для запуска middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Инициализация ЮKassa
const checkout = new YooCheckout({
  shopId: process.env.YOOKASSA_SHOP_ID,
  secretKey: process.env.YOOKASSA_SECRET_KEY,
});

// Главный обработчик
async function handler(req, res) {
  // Обрабатываем CORS
  try {
    await runMiddleware(req, res, cors);
  } catch (error) {
    console.error('CORS middleware error:', error);
    return res.status(500).json({ 
      error: 'CORS error',
      details: error.message 
    });
  }

  // Обрабатываем OPTIONS запрос (предзапрос браузера для CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Проверяем метод
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['POST'] 
    });
  }

  try {
    // Получаем данные из запроса
    const { userId } = req.body;
    
    // Проверяем наличие userId
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'userId is required and must be a string' 
      });
    }

    // Создаем уникальный ключ для идемпотентности
    const idempotenceKey = `hobby101-${userId}-${Date.now()}`;

    // Формируем данные для платежа
    const createPayload = {
      amount: {
        value: '350.00',
        currency: 'RUB',
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: `hobby101://home?payment=success&userId=${encodeURIComponent(userId)}`,
      },
      description: 'Доступ ко всем проектам «Хобби 101»',
      metadata: {
        userId: userId,
        product: 'all_projects_access',
        app: 'hobby101'
      }
    };

    // Создаем платеж в ЮKassa
    console.log(`Creating payment for userId: ${userId}, idempotenceKey: ${idempotenceKey}`);
    
    const payment = await checkout.createPayment(createPayload, idempotenceKey);
    
    console.log(`Payment created successfully. Payment ID: ${payment.id}, Status: ${payment.status}`);

    // Возвращаем успешный ответ
    return res.status(200).json({
      success: true,
      paymentId: payment.id,
      paymentUrl: payment.confirmation.confirmation_url,
      amount: payment.amount,
      status: payment.status,
      createdAt: new Date().toISOString()
    });

  } catch (error) {
    // Обработка ошибок
    console.error('Payment creation error:', error);
    
    // Детализация ошибок ЮKassa
    if (error.type === 'error' && error.code) {
      return res.status(400).json({
        success: false,
        error: 'YooKassa API Error',
        code: error.code,
        message: error.description || 'Payment creation failed',
        details: error
      });
    }

    // Общая ошибка сервера
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create payment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Экспорт в формате CommonJS для Vercel
module.exports = handler;