// Minimal Gemini-backed classify-title Edge Function
// Stores GEMINI_API_KEY in Supabase secrets and calls the Generative Language API

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
declare const Deno: any;

console.log("Starting minimal classify-title using Gemini API")

Deno.serve(async (req) => {
  try {
    // Accept GET/POST for quick testing; prefer POST with body { text, amount }
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: 'No GEMINI_API_KEY configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

    let text = '';
    let amount = 0;
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      text = String(body.text || '');
      amount = Number(body.amount || 0);
    }

    const prompt = `Classify the following expense into one of: Food, Travel, Shopping, Bills, Entertainment, Health, Misc. ` +
      `Return ONLY a single JSON object like {"category":"<one of the labels>","confidence":0.0} with no additional text.\nExpense: "${text}" Amount: ${amount}`;

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error('classify-title error', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
