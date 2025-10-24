export const config = {
  matcher: '/',
}; 

export function middleware(req) {
  const basicAuth = req.headers.get('authorization');
  
  // Читаем логин и пароль из безопасных переменных окружения
  const USER = process.env.BASIC_AUTH_USER;
  const PASS = process.env.BASIC_AUTH_PASS;
  
  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    // atob() декодирует строку из Base64
    const [user, pass] = atob(authValue).split(':');

    if (user === USER && pass === PASS) {
      // Если логин и пароль верны, разрешаем доступ
      return new Response(null, { status: 200 });
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


