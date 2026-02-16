import { createClient } from "@clickhouse/client";

function required(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function getClient() {
  return createClient({
    url: required("CLICKHOUSE_URL"),
    username: required("CLICKHOUSE_USER", "default"),
    password: required("CLICKHOUSE_PASSWORD"),
    database: process.env.CLICKHOUSE_DATABASE ?? "music_stats",
    request_timeout: 60_000,
  });
}
