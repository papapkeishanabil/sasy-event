import { json } from '@vercel/edge';
import type { RequestContext } from '@vercel/edge';

export const config = {
  runtime: 'edge',
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(request: RequestContext) {
  // Add CORS headers
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
    return json({ error: 'Guest ID is required' }, { status: 400, headers: corsHeaders });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return json({ error: 'Supabase not configured' }, { status: 500, headers: corsHeaders });
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/guests?id=eq.${guestId}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return json({ error: 'Guest not found' }, { status: 404, headers: corsHeaders });
    }

    return json(data[0], { headers: corsHeaders });
  } catch (error: any) {
    return json(
      { error: error.message || 'Failed to fetch guest data' },
      { status: 500, headers: corsHeaders }
    );
  }
}
