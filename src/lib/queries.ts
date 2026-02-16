import { QueryStats, runJsonQuery } from "./clickhouse";

type JsonRow = Record<string, unknown>;

type QueryWithStats<T extends JsonRow> = {
  rows: T[];
  stats: QueryStats;
};

async function queryWithStats<T extends JsonRow>(
  sql: string,
): Promise<QueryWithStats<T>> {
  const result = await runJsonQuery<T>(sql);
  return { rows: result.data, stats: result.stats };
}

export async function getOverview() {
  const result = await queryWithStats<{
    artists: number;
    areas: number;
    ended_artists: number;
    active_artists: number;
  }>(`
    SELECT
      count() AS artists,
      uniqExactIf(area_id, area_id IS NOT NULL) AS areas,
      countIf(ended = 1) AS ended_artists,
      countIf(ended = 0) AS active_artists
    FROM mb_artist
  `);

  return {
    row: result.rows[0],
    stats: result.stats,
  };
}

export async function getTopAreas(limit = 15) {
  return queryWithStats<{ area: string; artists: number }>(`
    SELECT
      if(r.area_id = 0, 'Unknown', coalesce(a.name, toString(r.area_id))) AS area,
      sum(r.artists) AS artists
    FROM mb_artist_area_rollup r
    LEFT ANY JOIN mb_area a ON a.area_id = r.area_id
    GROUP BY area
    ORDER BY artists DESC
    LIMIT ${limit}
  `);
}

export async function getTopInitials(limit = 20) {
  return queryWithStats<{ initial: string; artists: number }>(`
    SELECT
      if(lengthUTF8(trimBoth(name)) = 0, '#', upper(substringUTF8(trimBoth(name), 1, 1))) AS initial,
      count() AS artists
    FROM mb_artist
    GROUP BY initial
    ORDER BY artists DESC
    LIMIT ${limit}
  `);
}

export async function getMostEditedArtists(limit = 15) {
  return queryWithStats<{ name: string; edits: number }>(`
    SELECT
      name,
      max(edits) AS edits
    FROM mb_artist
    GROUP BY name
    ORDER BY edits DESC
    LIMIT ${limit}
  `);
}

export async function getRecentlyUpdated(limit = 10) {
  return queryWithStats<{ name: string; last_updated: string | null }>(`
    SELECT
      name,
      last_updated
    FROM mb_artist
    WHERE last_updated IS NOT NULL
    ORDER BY parseDateTimeBestEffortOrNull(last_updated) DESC
    LIMIT ${limit}
  `);
}

export async function getParetoByArea(limit = 25) {
  return queryWithStats<{
    rank: number;
    area: string;
    artists: number;
    cumulative_pct: number;
  }>(`
    WITH area_counts AS (
      SELECT
        coalesce(a.name, toString(r.area_id)) AS area,
        sum(r.artists) AS artists
      FROM mb_artist_area_rollup r
      LEFT ANY JOIN mb_area a ON a.area_id = r.area_id
      WHERE r.area_id != 0
      GROUP BY area
    ), ranked AS (
      SELECT
        area,
        artists,
        row_number() OVER (ORDER BY artists DESC) AS rank,
        sum(artists) OVER (ORDER BY artists DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_artists,
        sum(artists) OVER () AS total_artists
      FROM area_counts
    )
    SELECT
      rank,
      area,
      artists,
      round(100.0 * cumulative_artists / total_artists, 2) AS cumulative_pct
    FROM ranked
    ORDER BY rank ASC
    LIMIT ${limit}
  `);
}

export async function getParetoSummary() {
  const result = await queryWithStats<{
    area_count: number;
    areas_for_80pct: number;
    pct_of_areas_for_80: number;
  }>(`
    WITH area_counts AS (
      SELECT
        coalesce(a.name, toString(r.area_id)) AS area,
        sum(r.artists) AS artists
      FROM mb_artist_area_rollup r
      LEFT ANY JOIN mb_area a ON a.area_id = r.area_id
      WHERE r.area_id != 0
      GROUP BY area
    ), ranked AS (
      SELECT
        row_number() OVER (ORDER BY artists DESC) AS rank,
        count() OVER () AS area_count,
        100.0 * sum(artists) OVER (ORDER BY artists DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) / sum(artists) OVER () AS cumulative_pct
      FROM area_counts
    )
    SELECT
      area_count,
      rank AS areas_for_80pct,
      round(100.0 * rank / area_count, 2) AS pct_of_areas_for_80
    FROM ranked
    WHERE cumulative_pct >= 80
    ORDER BY rank ASC
    LIMIT 1
  `);

  return { row: result.rows[0], stats: result.stats };
}

export async function getRollupSpeedDemo(limit = 15) {
  const [raw, rollup] = await Promise.all([
    queryWithStats<{ area: string; artists: number }>(`
      SELECT
        ifNull(toString(area_id), 'Unknown') AS area,
        count() AS artists
      FROM mb_artist
      GROUP BY area
      ORDER BY artists DESC
      LIMIT ${limit}
    `),
    queryWithStats<{ area: string; artists: number }>(`
      SELECT
        if(area_id = 0, 'Unknown', toString(area_id)) AS area,
        sum(artists) AS artists
      FROM mb_artist_area_rollup
      GROUP BY area
      ORDER BY artists DESC
      LIMIT ${limit}
    `),
  ]);

  return {
    raw,
    rollup,
  };
}
