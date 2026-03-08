import express from 'express';

const router = express.Router();
const BASE_URL = 'https://api.openf1.org/v1';

// GET /api/f1/car-data
// Query params:
//   driver_number (required)
//   meeting_key (optional, can be 'latest')
//   session_key (optional, can be 'latest')
//   limit (optional)
//   speed_gte (optional, mapped to speed>=N)
router.get('/car-data', async (req, res) => {
  try {
    const { driver_number, meeting_key, session_key, limit, speed_gte } = req.query;

    if (!driver_number) {
      return res.status(400).json({ error: 'driver_number is required.' });
    }

    const parts = [];
    parts.push(`driver_number=${encodeURIComponent(driver_number)}`);
    if (meeting_key) parts.push(`meeting_key=${encodeURIComponent(meeting_key)}`);
    if (session_key) parts.push(`session_key=${encodeURIComponent(session_key)}`);
    if (limit) parts.push(`limit=${encodeURIComponent(limit)}`);
    if (speed_gte) parts.push(`speed>=${encodeURIComponent(speed_gte)}`);

    const query = parts.join('&');
    const url = `${BASE_URL}/car_data?${query}`;

    const upstream = await fetch(url);
    if (!upstream.ok) {
      const text = await upstream.text();
      // OpenF1 returns 404 with { "detail": "No results found." } when there is simply no data
      if (upstream.status === 404) {
        try {
          const parsed = JSON.parse(text);
          if (parsed?.detail === 'No results found.') {
            return res.json({ samples: [] });
          }
        } catch {
          // fall through to generic error handling
        }
      }
      return res
        .status(502)
        .json({ error: 'OpenF1 API error', status: upstream.status, detail: text.slice(0, 300) });
    }

    const data = await upstream.json();
    return res.json({ samples: Array.isArray(data) ? data : [] });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load car data.' });
  }
});

export default router;

