import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  try {
    const env = readFileSync('.env', 'utf8');
    for (const line of env.split('\n')) {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    }
  } catch {}
}
loadEnv();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/places/search', async (req, res) => {
  const { city, industry } = req.body;
  const googleKey = process.env.VITE_GOOGLE_PLACES_API_KEY;
  if (!googleKey) return res.status(400).json({ error: 'Google Places API key not configured.' });
  try {
    const query = encodeURIComponent(`${industry} in ${city}`);
    const searchRes = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${googleKey}`);
    const searchData = await searchRes.json();
    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      return res.status(400).json({ error: `Google Places error: ${searchData.status}` });
    }
    const leads = await Promise.all((searchData.results || []).slice(0, 20).map(async (place) => {
      try {
        const detailRes = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,formatted_address,website,rating,user_ratings_total&key=${googleKey}`);
        const { result: d = {} } = await detailRes.json();
        return { id: place.place_id, name: d.name || place.name || '', phone: d.formatted_phone_number || '', address: d.formatted_address || '', website: d.website || '', hasWebsite: !!d.website, rating: d.rating || null, reviews: d.user_ratings_total || 0, email: '', industry, city, scrapedAt: Date.now() };
      } catch { return null; }
    }));
    res.json({ leads: leads.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));