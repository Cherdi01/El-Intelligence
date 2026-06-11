// Vercel Serverless Function: sicherer Proxy zur Google-Gemini-API.
// Der API-Schlüssel liegt NUR hier als Umgebungsvariable (GEMINI_API_KEY)
// und kommt niemals in die App selbst.
//
// Kostenloser Schlüssel: https://aistudio.google.com/apikey  (ohne Kreditkarte)

const MODEL = 'gemini-2.5-flash-lite'; // Gratis-Stufe, schnell & günstig

export default async function handler(req, res) {
  // CORS – erlaubt der App, diese Funktion aufzurufen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Nur POST erlaubt' });

  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Kein Prompt übergeben' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server ist nicht konfiguriert (GEMINI_API_KEY fehlt)' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    });

    const data = await r.json();
    if (data.error) {
      return res.status(500).json({ error: data.error.message || 'Gemini-Fehler' });
    }

    // Text aus der Gemini-Antwort zusammensetzen
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || '').join('');
    if (!text) return res.status(500).json({ error: 'Leere Antwort von Gemini' });

    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Unbekannter Serverfehler' });
  }
}
