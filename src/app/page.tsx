import { InitialsChart } from "@/components/initials-chart";
import { ParetoChart } from "@/components/pareto-chart";
import { TopAreasChart } from "@/components/top-areas-chart";
import { QueryStats } from "@/lib/clickhouse";
import {
  getMostEditedArtists,
  getOverview,
  getParetoByArea,
  getParetoSummary,
  getRecentlyUpdated,
  getRollupSpeedDemo,
  getTopAreas,
  getTopInitials,
} from "@/lib/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <p className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function QueryCost({ stats }: { stats: QueryStats }) {
  return (
    <p className="text-xs text-black/60 dark:text-white/60">
      rows read: <span className="font-mono">{stats.rows_read.toLocaleString()}</span> · compute:
      <span className="font-mono"> {(stats.elapsed * 1000).toFixed(2)} ms</span>
    </p>
  );
}

export default async function Home() {
  const [overview, topAreas, topInitials, mostEdited, recentlyUpdated, pareto, paretoSummary, speedDemo] =
    await Promise.all([
      getOverview(),
      getTopAreas(15),
      getTopInitials(20),
      getMostEditedArtists(12),
      getRecentlyUpdated(10),
      getParetoByArea(25),
      getParetoSummary(),
      getRollupSpeedDemo(15),
    ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 p-6 sm:p-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">MusicBrainz × ClickHouse</h1>
        <p className="text-black/70 dark:text-white/70">
          Fast exploratory dashboard on top of a sizable MusicBrainz artist dataset.
        </p>
        <QueryCost stats={overview.stats} />
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Artists" value={overview.row.artists.toLocaleString()} />
        <StatCard label="Distinct areas" value={overview.row.areas.toLocaleString()} />
        <StatCard label="Ended artists" value={overview.row.ended_artists.toLocaleString()} />
        <StatCard label="Active artists" value={overview.row.active_artists.toLocaleString()} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div>
          <div className="mb-2">
            <QueryCost stats={topAreas.stats} />
          </div>
          <TopAreasChart data={topAreas.rows} />
        </div>
        <div>
          <div className="mb-2">
            <QueryCost stats={topInitials.stats} />
          </div>
          <InitialsChart data={topInitials.rows} />
        </div>
      </section>

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-black/70 dark:text-white/80">Pareto concentration</h2>
          <QueryCost stats={pareto.stats} />
        </div>
        <p className="mb-3 text-sm text-black/70 dark:text-white/70">
          <span className="font-semibold">{paretoSummary.row.areas_for_80pct}</span> out of{" "}
          <span className="font-semibold">{paretoSummary.row.area_count}</span> areas ({" "}
          <span className="font-semibold">{paretoSummary.row.pct_of_areas_for_80}%</span>) cover 80% of artists.
        </p>
        <ParetoChart data={pareto.rows} />
      </section>

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="mb-3 text-sm font-semibold text-black/70 dark:text-white/80">
          Materialized rollup speed demo (same top-area query)
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-black/10 p-3 dark:border-white/10">
            <p className="mb-2 text-xs uppercase tracking-wide text-black/50 dark:text-white/50">Raw table</p>
            <QueryCost stats={speedDemo.raw.stats} />
          </div>
          <div className="rounded-lg border border-black/10 p-3 dark:border-white/10">
            <p className="mb-2 text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
              Materialized rollup
            </p>
            <QueryCost stats={speedDemo.rollup.stats} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-black/70 dark:text-white/80">Most edited artists</h2>
            <QueryCost stats={mostEdited.stats} />
          </div>
          <ul className="space-y-2 text-sm">
            {mostEdited.rows.map((row, idx) => (
              <li
                key={`${row.name}-${idx}`}
                className="flex items-center justify-between gap-3 border-b border-black/5 pb-2 dark:border-white/5"
              >
                <span className="truncate">{row.name}</span>
                <span className="font-mono text-xs text-black/60 dark:text-white/60">
                  {row.edits.toLocaleString()} edits
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-black/70 dark:text-white/80">
              Recently updated artist records
            </h2>
            <QueryCost stats={recentlyUpdated.stats} />
          </div>
          <ul className="space-y-2 text-sm">
            {recentlyUpdated.rows.map((row, idx) => (
              <li
                key={`${row.name}-${idx}`}
                className="flex items-center justify-between gap-3 border-b border-black/5 pb-2 dark:border-white/5"
              >
                <span className="truncate">{row.name}</span>
                <span className="font-mono text-xs text-black/60 dark:text-white/60">
                  {row.last_updated ?? "n/a"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
