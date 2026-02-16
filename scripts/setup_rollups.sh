#!/usr/bin/env bash
set -euo pipefail

: "${CLICKHOUSE_URL:?Set CLICKHOUSE_URL}"
: "${CLICKHOUSE_USER:?Set CLICKHOUSE_USER}"
: "${CLICKHOUSE_PASSWORD:?Set CLICKHOUSE_PASSWORD}"
DB_NAME="${CLICKHOUSE_DATABASE:-music_stats}"

ch_query() {
  local q="$1"
  curl -sS --fail --user "$CLICKHOUSE_USER:$CLICKHOUSE_PASSWORD" \
    --data-binary "$q" "$CLICKHOUSE_URL/?database=${DB_NAME}"
}

echo "Creating rollup table + materialized view..."
ch_query "
CREATE TABLE IF NOT EXISTS mb_artist_area_rollup (
  area_id UInt32,
  artists UInt64,
  active_artists UInt64,
  ended_artists UInt64
) ENGINE = SummingMergeTree
ORDER BY area_id"

ch_query "
CREATE MATERIALIZED VIEW IF NOT EXISTS mb_artist_area_rollup_mv
TO mb_artist_area_rollup AS
SELECT
  ifNull(area_id, toUInt32(0)) AS area_id,
  count() AS artists,
  countIf(ended = 0) AS active_artists,
  countIf(ended = 1) AS ended_artists
FROM mb_artist
GROUP BY area_id"

echo "Backfilling rollup from existing data..."
ch_query "TRUNCATE TABLE mb_artist_area_rollup"
ch_query "
INSERT INTO mb_artist_area_rollup
SELECT
  ifNull(area_id, toUInt32(0)) AS area_id,
  count() AS artists,
  countIf(ended = 0) AS active_artists,
  countIf(ended = 1) AS ended_artists
FROM mb_artist
GROUP BY area_id"

echo "Validation:"
ch_query "SELECT count() AS rollup_rows, sum(artists) AS total_artists FROM mb_artist_area_rollup FORMAT PrettyCompact"
