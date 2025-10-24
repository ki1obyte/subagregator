// middleware.js
import { NextResponse } from 'next/server';

export const config = {
  matcher: '/',
};

export function middleware(req) {
  const basicAuth = req.headers.get('authorization');
  
  const USER = process.env.BASIC_AUTH_USER;
  const PASS = process.env.BASIC_AUTH_PASS;
  
  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pass] = atob(authValue).split(':');

    if (user === USER && pass === PASS) {
      // ИСПРАВЛЕНИЕ: Вместо возврата пустого ответа,
      // мы передаем запрос дальше для отрисовки страницы.
      return NextResponse.next();
    }
  }
  
  // Если авторизация не пройдена, запрашиваем ее (этот блок был правильным)
  return new Response('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
