#!/usr/bin/env bash
set -euo pipefail

: "${CLICKHOUSE_URL:?Set CLICKHOUSE_URL}"
: "${CLICKHOUSE_USER:?Set CLICKHOUSE_USER}"
: "${CLICKHOUSE_PASSWORD:?Set CLICKHOUSE_PASSWORD}"

DB_NAME="${CLICKHOUSE_DATABASE:-music_stats}"

ch_query() {
  local q="$1"
  curl -sS --fail --user "$CLICKHOUSE_USER:$CLICKHOUSE_PASSWORD" \
    --data-binary "$q" "$CLICKHOUSE_URL"
}

ch_insert_tsv() {
  local query="$1"
  local encoded
  encoded=$(python3 - <<PY
import urllib.parse
print(urllib.parse.quote('''$query'''))
PY
)
  curl -sS --fail --user "$CLICKHOUSE_USER:$CLICKHOUSE_PASSWORD" \
    --data-binary @- "$CLICKHOUSE_URL/?query=${encoded}"
}

echo "[1/5] Creating schema..."
ch_query "CREATE DATABASE IF NOT EXISTS ${DB_NAME}"
ch_query "
CREATE TABLE IF NOT EXISTS ${DB_NAME}.mb_artist (
  artist_id UInt32,
  artist_gid String,
  name String,
  sort_name String,
  type_id Nullable(UInt16),
  area_id Nullable(UInt32),
  gender_id Nullable(UInt16),
  comment Nullable(String),
  edits UInt32,
  last_updated Nullable(String),
  ended UInt8,
  begin_area_id Nullable(UInt32),
  end_area_id Nullable(UInt32)
) ENGINE = MergeTree
ORDER BY artist_id"

echo "[2/5] Resolving latest MusicBrainz dump..."
LATEST=$(curl -sS "https://data.metabrainz.org/pub/musicbrainz/data/fullexport/LATEST")
BASE_URL="https://data.metabrainz.org/pub/musicbrainz/data/fullexport/${LATEST}"
DUMP_URL="${BASE_URL}/mbdump.tar.bz2"

echo "Latest dump: ${LATEST}"
echo "Streaming from: ${DUMP_URL}"

echo "[3/5] Truncating old data..."
ch_query "TRUNCATE TABLE ${DB_NAME}.mb_artist"

echo "[4/5] Ingesting artist fact table (streaming, no full local extract)..."
ARTIST_LIMIT="${ARTIST_LIMIT:-}"
if [[ -n "$ARTIST_LIMIT" ]]; then
  echo "Applying ARTIST_LIMIT=${ARTIST_LIMIT} rows"
  set +o pipefail
  curl -L -sS "$DUMP_URL" \
    | tar xOjf - mbdump/artist \
    | head -n "$ARTIST_LIMIT" \
    | awk -F '\t' 'BEGIN{OFS="\t"} {ended=($17=="t"?1:0); print $1,$2,$3,$4,$11,$12,$13,$14,$15,$16,ended,$18,$19}' \
    | ch_insert_tsv "INSERT INTO ${DB_NAME}.mb_artist FORMAT TabSeparated"
  set -o pipefail
else
  curl -L -sS "$DUMP_URL" \
    | tar xOjf - mbdump/artist \
    | awk -F '\t' 'BEGIN{OFS="\t"} {ended=($17=="t"?1:0); print $1,$2,$3,$4,$11,$12,$13,$14,$15,$16,ended,$18,$19}' \
    | ch_insert_tsv "INSERT INTO ${DB_NAME}.mb_artist FORMAT TabSeparated"
fi

echo "[5/5] Validation queries"
ch_query "SELECT count() AS artist_rows FROM ${DB_NAME}.mb_artist FORMAT PrettyCompact"
ch_query "SELECT countIf(ended=1) AS ended_artists, countIf(ended=0) AS active_artists FROM ${DB_NAME}.mb_artist FORMAT PrettyCompact"
ch_query "SELECT ifNull(toString(area_id), 'Unknown') AS area_id, count() AS artists FROM ${DB_NAME}.mb_artist GROUP BY area_id ORDER BY artists DESC LIMIT 10 FORMAT PrettyCompact"

echo "Done."
