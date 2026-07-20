export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Expected an "items" array' });
  }

  try {
    const prompt = `Rewrite each of these rough line-item descriptions for a professional client quote.
Keep each one under 12 words, clear and confident, no fluff. Return ONLY a JSON array of strings, same order, nothing else.

Items:
${items.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '[]';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const polished = JSON.parse(cleaned);

    res.status(200).json({ polished });
  } catch (err) {
    console.error('Polish error:', err);
    res.status(500).json({ error: 'Could not polish text', polished: items });
  }
}
