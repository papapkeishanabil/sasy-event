const SUPABASE_URL = 'https://mrkjatwshfnldnfutuov.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cHFEhHIqlBuqLb9gcy0ztg_uI_cQZE8';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const guestId = url.searchParams.get('id');

  if (!guestId) {
    return new Response('Guest ID is required', { status: 400 });
  }

  try {
    // Fetch guest data
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/guests?id=eq.${guestId}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return new Response('Guest not found', { status: 404 });
    }

    const guest = data[0];
    // Encode as simple ID-only format for better compatibility
    const qrData = `id:${guest.id}`;

    // Use external QR code API (qrserver.com)
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;

    // Fetch the QR code image
    const qrResponse = await fetch(qrApiUrl);
    if (!qrResponse.ok) {
      throw new Error('QR API failed');
    }

    const qrBlob = await qrResponse.blob();

    return new Response(qrBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="QR_${guest.name.replace(/\s+/g, '_')}_${guest.id}.png"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    return new Response(error.message || 'Error generating QR', { status: 500 });
  }
}
