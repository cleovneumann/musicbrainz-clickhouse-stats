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
      ifNull(toString(area_id), 'Unknown') AS area,
      count() AS artists
    FROM mb_artist
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
