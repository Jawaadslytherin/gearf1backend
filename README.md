# Sports site backend

Node.js + Express API with MongoDB for the React sports app.

## Setup

1. Copy `.env.example` to `.env` and add your MongoDB URI:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:

   ```
   MONGODB_URI=mongodb+srv://your-user:your-password@your-cluster.mongodb.net/gearupf1?retryWrites=true&w=majority
   PORT=3001
   ```

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

Server runs at **http://127.0.0.1:3001**.

## API

- `GET /api/health` – health check
- `GET /api/articles` – list articles (query: `category`, `featured`, `limit`)
- `GET /api/articles/by-slug/:slug` – get one article by slug (for full article page)
- `GET /api/articles/:id` – get one article by id
- `POST /api/articles` – create article (JSON body)
- `PUT /api/articles/:id` – update article
- `DELETE /api/articles/:id` – delete article
- `POST /api/upload` – upload image (multipart form field `image`); returns `{ url }`
- `GET /uploads/*` – serve uploaded images
- `GET /api/football/matches` – matches (football-data.org v4). Query: `status` (SCHEDULED \| LIVE \| IN_PLAY \| PAUSED \| FINISHED \| POSTPONED \| SUSPENDED \| CANCELLED), `dateFrom`, `dateTo` (yyyy-MM-dd), `competitions` (comma-separated ids), `limit` (default 15). If no dates given, uses today. Requires `FOOTBALL_DATA_API_KEY` in `.env` (free at [football-data.org](https://www.football-data.org/)).
- `GET /api/football/competitions` – list competitions (optional: `areas` filter).

## Admin

Use the React app at **http://127.0.0.1:5173/admin** (or 5174) to add and edit articles and upload cover images.
