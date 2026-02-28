import express from 'express';

const router = express.Router();
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const BASE = 'https://api.football-data.org/v4';

// Status values per docs: SCHEDULED | LIVE | IN_PLAY | PAUSED | FINISHED | POSTPONED | SUSPENDED | CANCELLED
const VALID_STATUS = new Set(['SCHEDULED', 'LIVE', 'IN_PLAY', 'PAUSED', 'FINISHED', 'POSTPONED', 'SUSPENDED', 'CANCELLED']);

function todayUTC() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // yyyy-MM-dd
}

async function fetchFootball(path) {
  if (!API_KEY) return { ok: false, reason: 'no_key' };
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'X-Auth-Token': API_KEY },
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, status: res.status, reason: 'api_error', detail: text.slice(0, 200) };
  }
  const data = await res.json();
  return { ok: true, data };
}

/**
 * GET /api/football/matches
 * Filters (per football-data.org v4):
 *   status   - SCHEDULED | LIVE | IN_PLAY | PAUSED | FINISHED | POSTPONED | SUSPENDED | CANCELLED
 *   dateFrom - yyyy-MM-dd
 *   dateTo   - yyyy-MM-dd
 *   competitions - comma-separated competition ids (e.g. 2021,2014)
 *   limit    - default 10 (API default), max 20
 * If no dateFrom/dateTo given, uses today for both (today's matches).
 */
router.get('/matches', async (req, res) => {
  try {
    const { status, dateFrom, dateTo, competitions, limit = '15' } = req.query;
    const params = new URLSearchParams();
    params.set('limit', String(Math.min(Number(limit) || 15, 20)));

    if (status && VALID_STATUS.has(String(status).toUpperCase())) {
      params.set('status', String(status).toUpperCase());
    }
    const from = dateFrom || todayUTC();
    const to = dateTo || todayUTC();
    params.set('dateFrom', from);
    params.set('dateTo', to);
    if (competitions && String(competitions).trim()) {
      params.set('competitions', String(competitions).trim());
    }

    const path = `/matches?${params.toString()}`;
    const result = await fetchFootball(path);

    if (!result.ok) {
      const hasKey = !!API_KEY;
      let message = 'Unable to load matches.';
      if (result.reason === 'no_key') {
        message = 'Add FOOTBALL_DATA_API_KEY to .env. Get a free key at https://www.football-data.org/';
      } else if (result.status === 403 || result.status === 401) {
        message = 'Invalid or inactive API key. Check your key at football-data.org.';
      } else if (result.status === 429) {
        message = 'Too many requests. Try again in a minute.';
      }
      return res.json({ matches: [], message, hasKey });
    }

    const data = result.data;

    // v4: score.fullTime.home / score.fullTime.away (or halfTime)
    const matches = (data.matches || []).map((m) => ({
      id: m.id,
      competition: m.competition?.name || 'League',
      competitionCode: m.competition?.code,
      homeTeam: m.homeTeam?.shortName || m.homeTeam?.name || 'Home',
      awayTeam: m.awayTeam?.shortName || m.awayTeam?.name || 'Away',
      homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home,
      awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away,
      status: m.status,
      minute: m.minute,
      utcDate: m.utcDate,
      matchday: m.matchday,
      venue: m.venue,
    }));

    res.json({ matches });
  } catch (err) {
    res.status(500).json({ matches: [], error: err.message });
  }
});

/**
 * GET /api/football/competitions
 * List available competitions (optional: areas filter).
 */
router.get('/competitions', async (req, res) => {
  try {
    const { areas } = req.query;
    let path = '/competitions';
    if (areas && String(areas).trim()) {
      path += `?areas=${String(areas).trim()}`;
    }
    const result = await fetchFootball(path);
    if (!result.ok) {
      return res.json({ competitions: [], message: result.reason === 'no_key' ? 'No API key.' : 'API error.' });
    }
    const data = result.data;
    const raw = data.competitions || (Array.isArray(data) ? data : []);
    const list = raw.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      area: c.area?.name,
    }));
    res.json({ competitions: list });
  } catch (err) {
    res.status(500).json({ competitions: [], error: err.message });
  }
});

export default router;
