// Netlify Function: dynamic PWA manifest from Supabase
// It reads `site_data` (id=1) -> settings (appIconUrl, pwaName, pwaShortName, name)
// and returns a manifest that Android/Chrome can install.

exports.handler = async (event) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing SUPABASE_URL / SUPABASE_ANON_KEY environment variables.'
        })
      };
    }

    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/site_data?id=eq.1&select=settings,updated_at`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      const txt = await res.text();
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Supabase request failed', details: txt })
      };
    }

    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : rows;
    const settings = (row && row.settings) ? row.settings : {};
    const updatedAt = row && row.updated_at ? row.updated_at : '';

    const name = settings.pwaName || settings.name || 'App';
    const shortName = settings.pwaShortName || settings.name || 'App';

    // Cache-buster to make NEW installs pick up new icon/name quickly.
    const v = updatedAt ? encodeURIComponent(updatedAt) : String(Date.now());

    // If the admin stores a public URL in settings.appIconUrl, use it for ALL icon variants.
    // Important: many Android launchers prefer the *maskable* icon if present. If we leave
    // maskable pointing to a local/static file, the installed icon may look "stuck" even
    // after the admin changes appIconUrl. So we also point the maskable icon to the same
    // dynamic URL (with a cache-busting query).
    const remoteIcon = settings.appIconUrl
      ? `${settings.appIconUrl}${settings.appIconUrl.includes('?') ? '&' : '?'}v=${v}`
      : null;

    const manifest = {
      name,
      short_name: shortName,
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#04080F',
      theme_color: '#04080F',
      icons: [
        {
          src: remoteIcon || '/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: remoteIcon || '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: remoteIcon || '/icons/icon-512-maskable.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0'
      },
      body: JSON.stringify(manifest)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unexpected error', message: err?.message || String(err) })
    };
  }
};
