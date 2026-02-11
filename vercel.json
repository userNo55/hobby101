// /api/createPayment.js
const { YooCheckout } = require('@a2seven/yoo-checkout');

// Инициализация клиента ЮKassa
const checkout = new YooCheckout({
  shopId: process.env.YOOKASSA_SHOP_ID,  // shopId из настроек магазина
  secretKey: process.env.YOOKASSA_SECRET_KEY,  // Секретный ключ
});

module.exports = async (req, res) => {
  console.log('[/api/createPayment] Запрос получен. Метод:', req.method);
  
  // Обязательно обрабатываем только POST-запросы
  if (req.method !== 'POST') {
    console.warn('[/api/createPayment] Вызван не POST-методом:', req.method);
    return res.status(405).json({ 
      success: false, 
      error: 'Метод не разрешен. Используйте POST.' 
    });
  }

  try {
    // 1. Получаем данные из тела запроса
    const { userId } = req.body;
    console.log('[/api/createPayment] Получен userId:', userId);

    // 2. Проверяем наличие userId
    if (!userId || userId.trim() === '') {
      throw new Error('Отсутствует или пустой параметр userId');
    }

    // 3. Создаём payload для ЮKassa
    const createPayload = {
      amount: {
        value: '350.00',
        currency: 'RUB',
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        // Ключевое исправление: userId подставляем из переменной запроса
        return_url: `https://hobby101server.vercel.app/success.html?userId=${encodeURIComponent(userId)}&paymentId={payment_id}`,
      },
      description: 'Доступ ко всем проектам «Хобби 101»',
      metadata: {
        userId: userId,
        product: 'all_projects_access'
      }
    };

    console.log('[/api/createPayment] Создаю платёж с payload:', JSON.stringify(createPayload));

    // 4. Создаём платёж в ЮKassa
    const payment = await checkout.createPayment(createPayload);
    console.log('[/api/createPayment] Платёж создан в ЮKassa, ID:', payment.id);

    // 5. Возвращаем успешный ответ с URL для оплаты
    return res.status(200).json({
      success: true,
      paymentId: payment.id,
      paymentUrl: payment.confirmation.confirmation_url // URL для перехода к оплате
    });

  } catch (error) {
    // 6. Обрабатываем все возможные ошибки
    console.error('[/api/createPayment] Критическая ошибка:', error.message, '\nStack:', error.stack);
    
    // Проверяем, является ли ошибка специфичной от ЮKassa
    let errorMessage = error.message;
    if (error.type === 'api_error' || error.type === 'invalid_request') {
      errorMessage = `Ошибка платежной системы: ${error.message}`;
    }
    
    return res.status(500).json({ 
      success: false, 
      error: errorMessage,
      // Дополнительная информация для отладки (можно убрать в продакшене)
      hint: 'Проверьте shopId, secretKey, параметры запроса и доступность ЮKassa API.'
    });
  }
};