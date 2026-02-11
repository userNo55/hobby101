const { YooCheckout } = require('@a2seven/yoo-checkout');

// Инициализация ЮKassa
const checkout = new YooCheckout({
  shopId: process.env.YOOKASSA_SHOP_ID,
  secretKey: process.env.YOOKASSA_SECRET_KEY,
});

module.exports = async (req, res) => {
  // Разрешаем CORS для запросов из приложения
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обрабатываем preflight запрос
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Метод не разрешен. Используйте POST.' 
    });
  }

  try {
    // 1. Получаем userId из тела запроса
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Отсутствует userId'
      });
    }

    console.log('Создание платежа для userId:', userId);

    // 2. Создаём платеж в ЮKassa
    const createPayload = {
      amount: {
        value: '350.00',
        currency: 'RUB',
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: `https://hobby101server.vercel.app/success.html?userId=${encodeURIComponent(userId)}&paymentId={payment_id}`,
      },
      description: 'Доступ ко всем проектам «Хобби 101»',
      metadata: {
        userId: userId,
        product: 'all_projects_access'
      }
    };

    const payment = await checkout.createPayment(createPayload);
    console.log('Платёж создан, ID:', payment.id);

    // 3. Возвращаем успешный ответ
    return res.status(200).json({
      success: true,
      paymentId: payment.id,
      paymentUrl: payment.confirmation.confirmation_url
    });

  } catch (error) {
    // 4. Подробное логирование ошибки
    console.error('❌ ОШИБКА В createPayment:');
    console.error('Имя ошибки:', error.name);
    console.error('Сообщение:', error.message);
    console.error('Стек:', error.stack);
    
    // 5. Возвращаем понятную ошибку клиенту
    return res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера при создании платежа',
      details: error.message // Убираем в продакшене
    });
  }
};