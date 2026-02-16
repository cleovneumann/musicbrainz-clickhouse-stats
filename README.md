# MusicBrainz ClickHouse Stats (Next.js)

A first prototype music statistics web app built with **Next.js + ClickHouse**.

It uses the **MusicBrainz** dataset (from the Wikipedia list of online music databases):
- https://en.wikipedia.org/wiki/List_of_online_music_databases
- https://musicbrainz.org/

## Why this dataset

- Open and widely used music metadata database
- Very large (millions of artist records)
- Supports scalable ingestion by **streaming** from official dumps

## Data source and ingestion strategy

Source dump:
- `https://data.metabrainz.org/pub/musicbrainz/data/fullexport/LATEST`
- uses `mbdump.tar.bz2`

Scalable ingestion approach:
- No full local extraction required
- Stream over HTTP (`curl`) 
- Stream-extract only required file (`tar xOjf - mbdump/artist`)
- Transform rows in a Unix pipeline (`awk`)
- Insert directly into ClickHouse with `FORMAT TabSeparated`

This avoids large temporary disk usage and fits constrained environments.

## Architecture

- **Frontend:** Next.js App Router
- **DB:** ClickHouse Cloud
- **Client lib:** `@clickhouse/client`
- **Charts:** `recharts`
- **Dataset table:** `music_stats.mb_artist`

## Environment

Copy `.env.example` to `.env.local` and fill in credentials:

```bash
cp .env.example .env.local
```

Variables:
- `CLICKHOUSE_URL`
- `CLICKHOUSE_USER`
- `CLICKHOUSE_PASSWORD`
- `CLICKHOUSE_DATABASE` (default: `music_stats`)

## Ingest data

```bash
chmod +x ./scripts/ingest_musicbrainz_artists.sh
./scripts/ingest_musicbrainz_artists.sh
```

## Run app locally

```bash
npm install
npm run dev
```

Open: http://localhost:3000

## Prototype visualizations

- Total artists / distinct area IDs / ended vs active artists
- Top area IDs by artist count
- Most common artist initials
- Most edited artists
- Recently updated artist records

## Deploying to Vercel

1. Push this repo to GitHub
2. Import repo in Vercel
3. Add env vars from `.env.example`
4. Deploy

## Notes

This is intentionally a first prototype focused on:
- robust ingestion
- fast aggregate queries
- clear path to iterate with richer dimensions (e.g. area names, artist type labels, releases)
