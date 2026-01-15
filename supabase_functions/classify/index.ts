// Supabase Edge Function (Deno) example: classify.ts
// Deploy this function to Supabase Functions (name: 'classify').
// It expects a secret GEMINI_API_KEY set in Supabase project secrets.

// NOTE: Adjust the external API call to match your Gemini/Vertex AI access method.
// This example demonstrates the flow: receive { text, amount } -> call Gemini -> return { category, confidence }.

import { serve } from 'std/server';

serve(async (req) => {
  try {
    const body = await req.json();
    const { text, amount } = body || {};

    const key = Deno.env.get('GEMINI_API_KEY');
    if (!key) return new Response(JSON.stringify({ error: 'No GEMINI_API_KEY configured' }), { status: 500 });

    // Build a prompt for the model
    const prompt = `Classify the following expense into one of: Food, Travel, Shopping, Bills, Entertainment, Health, Misc. ` +
      `Return JSON {"category": "...", "confidence": 0.0} only.\nExpense: "${text}" Amount: ${amount || 0}`;

    // Example endpoint: Google Generative Models API. Replace with your working endpoint.
    const url = 'https://us-central1-aiplatform.googleapis.com/v1/projects/zflydzgucatmxnagubzv/locations/us-central1/publishers/google/models/text-bison:predict';

    const payload = {
      instances: [ { content: prompt } ],
      parameters: { temperature: 0.0 }
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error('Model call failed', resp.status, txt);
      return new Response(JSON.stringify({ error: 'Model call failed', detail: txt }), { status: 502 });
    }

    const json = await resp.json();

    // Attempt to extract model text. This depends on model API.
    const modelText = json?.predictions?.[0]?.content || json?.predictions?.[0]?.output || JSON.stringify(json);

    // Try to parse category JSON
    try {
      const parsed = JSON.parse(modelText);
      return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      // As a fallback, do some heuristic parsing
      const txt = (modelText || '').toLowerCase();
      let category = 'Misc';
      if (txt.includes('food') || txt.includes('restaurant') || txt.includes('zomato') || txt.includes('swiggy')) category = 'Food';
      else if (txt.includes('rent') || txt.includes('bill') || txt.includes('electricity')) category = 'Bills';
      else if (txt.includes('netflix') || txt.includes('movie')) category = 'Entertainment';

      return new Response(JSON.stringify({ category, confidence: 0.6 }), { headers: { 'Content-Type': 'application/json' } });
    }

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
});
