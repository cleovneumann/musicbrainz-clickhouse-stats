export type QueryStats = {
  elapsed: number;
  rows_read: number;
  bytes_read: number;
};

function required(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function getConfig() {
  return {
    url: required("CLICKHOUSE_URL"),
    user: required("CLICKHOUSE_USER", "default"),
    password: required("CLICKHOUSE_PASSWORD"),
    database: process.env.CLICKHOUSE_DATABASE ?? "music_stats",
  };
}

export async function runJsonQuery<T extends Record<string, unknown>>(
  sql: string,
): Promise<{ data: T[]; stats: QueryStats }> {
  const cfg = getConfig();
  const auth = Buffer.from(`${cfg.user}:${cfg.password}`).toString("base64");

  const endpoint = `${cfg.url}${cfg.url.includes("?") ? "&" : "?"}database=${encodeURIComponent(cfg.database)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "text/plain; charset=UTF-8",
    },
    body: `${sql.trim()}\nFORMAT JSON`,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ClickHouse query failed: ${response.status} ${text}`);
  }

  const payload = (await response.json()) as {
    data?: T[];
    statistics?: { elapsed?: number; rows_read?: number; bytes_read?: number };
  };

  return {
    data: payload.data ?? [],
    stats: {
      elapsed: Number(payload.statistics?.elapsed ?? 0),
      rows_read: Number(payload.statistics?.rows_read ?? 0),
      bytes_read: Number(payload.statistics?.bytes_read ?? 0),
    },
  };
}
