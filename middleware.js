export const config = {
  matcher: '/', // Применять защиту только к главной странице
};

export function middleware(req) {
  const basicAuth = req.headers.get('authorization');
  
  // --- ВАШИ ДАННЫЕ ДЛЯ ВХОДА ---
  const USER = 'admin';       // Замените на свой логин
  const PASS = '6367'; // Замените на свой СЛОЖНЫЙ пароль
  // ---------------------------------

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pass] = atob(authValue).split(':');

    if (user === USER && pass === PASS) {
      return new Response(null, { status: 200 }); // Доступ разрешен
    }
  }
  
  // Если авторизация не пройдена, запрашиваем ее
  return new Response('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}