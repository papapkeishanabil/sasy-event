const SUPABASE_URL = 'https://mrkjatwshfnldnfutuov.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cHFEhHIqlBuqLb9gcy0ztg_uI_cQZE8';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { oldName, newName } = body;

    if (!oldName || !newName) {
      return new Response(
        JSON.stringify({ error: 'oldName and newName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update all guests with the old category name
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/guests?category=eq.${oldName}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ category: newName }),
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ success: true, updated: data.length || 0, message: `Updated ${data.length || 0} guests from "${oldName}" to "${newName}"` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update categories' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
