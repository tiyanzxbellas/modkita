const UA = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.6099.144 Mobile Safari/537.36',
];

const ALLOWED_DOMAINS = ['an1.com', 'files.an1.net'];

function isAllowed(hostname: string) {
  return ALLOWED_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
}

export const config = {
  runtime: 'edge',
};

export default async (req: Request) => {
  const url = new URL(req.url);
  const target = url.searchParams.get('url');

  if (!target) {
    return new Response(JSON.stringify({ status: false, message: 'URL is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const targetUrl = new URL(target);
    if (!isAllowed(targetUrl.hostname)) {
      return new Response(JSON.stringify({ status: false, message: 'Forbidden: Domain not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ status: false, message: 'Invalid URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const upstream = await fetch(target, {
      headers: {
        'User-Agent': UA[Math.floor(Math.random() * UA.length)],
        Referer: 'https://an1.com/',
      },
      redirect: 'follow',
    });

    if (!upstream.ok || !upstream.body) {
      return new Response('Failed to download file', { status: 502 });
    }

    const headers = new Headers();
    const contentType = upstream.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);

    const contentLength = upstream.headers.get('content-length');
    if (contentLength) headers.set('Content-Length', contentLength);

    const contentDisposition = upstream.headers.get('content-disposition');
    if (contentDisposition) {
      headers.set('Content-Disposition', contentDisposition);
    } else {
      const parts = target.split('/');
      let filename = parts[parts.length - 1] || 'download.apk';
      if (filename.includes('?')) filename = filename.split('?')[0];
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    }

    // Stream the upstream body straight through to the client instead of
    // buffering it in memory.
    return new Response(upstream.body, { status: 200, headers });
  } catch (err) {
    return new Response('Failed to download file', { status: 500 });
  }
};
