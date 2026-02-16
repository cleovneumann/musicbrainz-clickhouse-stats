import { InitialsChart } from "@/components/initials-chart";

export const dynamic = "force-dynamic";
import { TopAreasChart } from "@/components/top-areas-chart";
import {
  getMostEditedArtists,
  getOverview,
  getRecentlyUpdated,
  getTopAreas,
  getTopInitials,
} from "@/lib/queries";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <p className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default async function Home() {
  const [overview, topAreas, topInitials, mostEdited, recentlyUpdated] = await Promise.all([
    getOverview(),
    getTopAreas(15),
    getTopInitials(20),
    getMostEditedArtists(12),
    getRecentlyUpdated(10),
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 p-6 sm:p-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">MusicBrainz × ClickHouse</h1>
        <p className="text-black/70 dark:text-white/70">
          Fast exploratory dashboard on top of a sizable MusicBrainz artist dataset.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Artists" value={overview.artists.toLocaleString()} />
        <StatCard label="Distinct areas" value={overview.areas.toLocaleString()} />
        <StatCard label="Ended artists" value={overview.ended_artists.toLocaleString()} />
        <StatCard label="Active artists" value={overview.active_artists.toLocaleString()} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TopAreasChart data={topAreas} />
        <InitialsChart data={topInitials} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-3 text-sm font-semibold text-black/70 dark:text-white/80">
            Most edited artists
          </h2>
          <ul className="space-y-2 text-sm">
            {mostEdited.map((row, idx) => (
              <li key={`${row.name}-${idx}`} className="flex items-center justify-between gap-3 border-b border-black/5 pb-2 dark:border-white/5">
                <span className="truncate">{row.name}</span>
                <span className="font-mono text-xs text-black/60 dark:text-white/60">
                  {row.edits.toLocaleString()} edits
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-3 text-sm font-semibold text-black/70 dark:text-white/80">
            Recently updated artist records
          </h2>
          <ul className="space-y-2 text-sm">
            {recentlyUpdated.map((row, idx) => (
              <li key={`${row.name}-${idx}`} className="flex items-center justify-between gap-3 border-b border-black/5 pb-2 dark:border-white/5">
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
