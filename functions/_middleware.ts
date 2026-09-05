import { CFP_ALLOWED_PATHS } from './constants';
import { getCookieKeyValue } from './utils';
import { getTemplate } from './template';

export async function onRequest(context: {
  request: Request;
  next: () => Promise<Response>;
  env: { CFP_PASSWORD?: string };
}): Promise<Response> {
  const { request, next, env } = context;
  const { pathname, searchParams } = new URL(request.url);
  const { error } = Object.fromEntries(searchParams);
  const cookie = request.headers.get('cookie') || '';
  const cookieKeyValue = await getCookieKeyValue(env.CFP_PASSWORD);

  // No password configured → refuse (never serve Luce open to the public)
  if (!env.CFP_PASSWORD) {
    return new Response(
      'Luce preview is locked. Set CFP_PASSWORD on this Cloudflare Pages project.',
      { status: 503, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } }
    );
  }

  if (
    cookie.includes(cookieKeyValue) ||
    (request.method === 'POST' && pathname === '/cfp_login') ||
    CFP_ALLOWED_PATHS.includes(pathname)
  ) {
    return await next();
  }

  return new Response(getTemplate({ redirectPath: pathname, withError: error === '1' }), {
    headers: {
      'content-type': 'text/html',
      'cache-control': 'no-cache'
    }
  });
}
