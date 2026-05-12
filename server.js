import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';

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

// Claude chat endpoint
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
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

// Google Places search endpoint
app.post('/api/places/search', async (req, res) => {
  const { city, industry } = req.body;
  const googleKey = process.env.VITE_GOOGLE_PLACES_API_KEY;

  if (!googleKey) {
    return res.status(400).json({ error: 'Google Places API key not configured. Add VITE_GOOGLE_PLACES_API_KEY to your .env file.' });
  }

  try {
    // Text search for businesses in the area
    const query = encodeURIComponent(`${industry} in ${city}`);
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${googleKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      return res.status(400).json({ error: `Google Places error: ${searchData.status} — ${searchData.error_message || ''}` });
    }

    const places = searchData.results || [];

    // Get details for each place
    const leads = await Promise.all(places.slice(0, 20).map(async (place) => {
      try {
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,formatted_address,website,rating,user_ratings_total,editorial_summary&key=${googleKey}`;
        const detailRes = await fetch(detailUrl);
        const detailData = await detailRes.json();
        const d = detailData.result || {};

        return {
          id: place.place_id,
          name: d.name || place.name || '',
          phone: d.formatted_phone_number || '',
          address: d.formatted_address || place.formatted_address || '',
          website: d.website || '',
          hasWebsite: !!d.website,
          rating: d.rating || place.rating || null,
          reviews: d.user_ratings_total || place.user_ratings_total || 0,
          email: '', // Google Places doesn't provide emails
          industry,
          city,
          scrapedAt: Date.now(),
        };
      } catch {
        return null;
      }
    }));

    const validLeads = leads.filter(Boolean);
    res.json({ leads: validLeads, total: validLeads.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('API server running on http://localhost:3001'));
