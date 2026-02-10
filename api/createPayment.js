const createPayload = {
  amount: {
    value: '350.00',
    currency: 'RUB',
  },
  capture: true,
  confirmation: {
    type: 'redirect',
    // Указываем URL вашей страницы редиректа на Vercel
    return_url: `https://hobby101server.vercel.app/success.html?userId=${encodeURIComponent(userId)}&paymentId={payment_id}`,
  },
  description: 'Доступ ко всем проектам «Хобби 101»',
  metadata: {
    userId: userId,
    product: 'all_projects_access'
  }
};