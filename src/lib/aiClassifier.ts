// Use Gemini directly via API key. The key is read from (in priority): globalThis.GEMINI_API_KEY, process.env.GEMINI_API_KEY


// Local keyword fallback (keeps previous behavior)
const keywordMap: Record<string, string> = {
  zomato: 'Food',
  swiggy: 'Food',
  uber: 'Travel',
  ola: 'Travel',
  amazon: 'Shopping',
  flipkart: 'Shopping',
  rent: 'Bills',
  electricity: 'Bills',
  netflix: 'Entertainment',
  spotify: 'Entertainment',
  pharmacy: 'Health',
  doctor: 'Health',
};

export type AiResult = { category: string | null; confidence: number };

async function localClassify(text: string, amount?: number): Promise<AiResult> {
  const t = (text || '').toLowerCase();
  if (!t.trim()) return { category: null, confidence: 0 };
  for (const kw of Object.keys(keywordMap)) {
    if (t.includes(kw)) {
      const base = 0.9;
      const boost = amount && amount > 10000 ? 0.02 : 0;
      return { category: keywordMap[kw], confidence: Math.min(0.99, base + boost) };
    }
  }
  if (amount && amount > 10000) return { category: 'Bills', confidence: 0.6 };
  if (amount && amount < 500) return { category: 'Food', confidence: 0.55 };
  return { category: null, confidence: 0 };
}

// Try Supabase Edge Function named `classify`. Falls back to local classifier if function not available.
export async function classify(text: string, amount?: number): Promise<AiResult> {
  const t = (text || '').trim();
  if (!t) return { category: null, confidence: 0 };

  // Try to get API key from common places. Note: exposing API keys client-side can be insecure.
  const apiKey = "AIzaSyA_4ptYrQCcHFLtYGFYbd7SJl5ajK3O0q0"; //(globalThis as any)?.GEMINI_API_KEY || (typeof process !== 'undefined' && (process as any)?.env?.GEMINI_API_KEY) || '';
  console.log('Using GEMINI_API_KEY:', apiKey);
  if (!apiKey) {
    // No API key available — fallback to local simple classifier
    return localClassify(text, amount);
  }

  try {
    const prompt = `Classify the following expense into one of: Food, Travel, Shopping, Bills, Entertainment, Health, Misc. ` +
      `Return ONLY a single JSON object like {"category":"<one of the labels>","confidence":0.0} with no additional text.\nExpense: "${t}" Amount: ${Number(amount || 0)}`;

    // const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    // const url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";
    // const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";


    // const res = await fetch(
    //   `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    // );
    // const json = await res.json();
    // console.log(JSON.stringify(json, null, 2));

    const model = "gemini-2.0-flash-lite";

    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    // const res = await fetch(`${url}?key=${apiKey}`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(body),
    // });

    // const text = await res.text();
    // console.log("Status:", res.status);
    // console.log("Body:", text);


    /////////
    // const body = {
    //   contents: [{ parts: [{ text: prompt }] }],
    // };

    // const res = await fetch(`${url}?key=${apiKey}`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(body),
    // });

    // console.log('Gemini response status:', res);
    //     if (!res.ok) {
    //       console.warn('Gemini request failed', res.status);
    //       return localClassify(text, amount);
    //     }

    //     const json = await res.json();

    //     // Try to extract textual output from several possible shapes returned by the Generative Language API
    //     let modelText = '';
    //     try {
    //       if (json?.candidates?.length) {
    //         const cand = json.candidates[0];
    //         if (Array.isArray(cand?.content)) {
    //           modelText = cand.content.map((c: any) => c?.text ?? JSON.stringify(c)).join(' ');
    //         } else if (typeof cand?.content === 'string') {
    //           modelText = cand.content;
    //         } else {
    //           modelText = JSON.stringify(cand);
    //         }
    //       }

    //       if (!modelText && json?.output?.length) {
    //         modelText = JSON.stringify(json.output);
    //       }
    //       if (!modelText && json?.results?.length) {
    //         modelText = JSON.stringify(json.results[0]);
    //       }
    //       if (!modelText) {
    //         modelText = JSON.stringify(json);
    //       }
    //     } catch (e) {
    //       modelText = JSON.stringify(json);
    //     }

    //     // try to parse a JSON object returned by the model
    //     try {
    //       const parsed = JSON.parse(modelText);
    //       if (parsed && parsed.category) return { category: parsed.category, confidence: Number(parsed.confidence) || 0 };
    //     } catch (e) {
    //       // model didn't return strict JSON; fall through to heuristics
    //     }

    // Use local heuristics on the returned text
    const heur = await localClassify(modelText, amount);
    if (heur.category) return heur;

    return { category: null, confidence: 0 };
  } catch (err) {
    console.warn('Gemini classify failed, falling back to local', err);
    return localClassify(text, amount);
  }
}
