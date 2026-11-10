import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { TopBar } from '../components/ui'
import { DonateButton } from '../components/DonateButton'

const STEPS = [
  { id: 'create', n: 1, title: 'Create a room', text: 'Pick the beers and how to rate them.' },
  { id: 'dashboard', n: 2, title: 'Open the dashboard', text: 'Put it on the TV and let everyone join.' },
  { id: 'rate', n: 3, title: 'Taste and rate', text: 'Everyone scores on their phone.' },
  { id: 'reveal', n: 4, title: 'Reveal the score', text: 'Drumroll, final score, leaderboard.' },
]

function Screenshot({ src, alt, phone = false, crop }: { src: string; alt: string; phone?: boolean; crop?: string }) {
  if (phone) {
    return (
      <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-[34px] border-[7px] border-ink bg-ink shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
        <img src={`/images/how/${src}`} alt={alt} loading="lazy" className={`block w-full rounded-[26px] object-cover object-top ${crop ?? ''}`} />
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
      <img src={`/images/how/${src}`} alt={alt} loading="lazy" className={`block w-full object-cover object-top ${crop ?? ''}`} />
    </div>
  )
}

function Point({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-pink" aria-hidden />
      <span>
        <b className="text-ink">{title}</b> <span className="text-muted">{children}</span>
      </span>
    </li>
  )
}

interface SectionProps {
  id: string
  n?: number
  eyebrow: string
  title: string
  intro: string
  points: ReactNode
  media: ReactNode
  flip?: boolean
}

function Section({ id, n, eyebrow, title, intro, points, media, flip = false }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-line py-12 last:border-0 sm:py-16">
      <div className={`grid items-center gap-10 ${flip ? 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]' : 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]'}`}>
        <div className={flip ? 'lg:order-2' : ''}>
          <div className="flex items-center gap-3">
            {n !== undefined && (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink pt-0.5 font-display text-xl text-white">{n}</span>
            )}
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-pink">{eyebrow}</span>
          </div>
          <h2 className="mt-3 font-display text-5xl leading-none">{title}</h2>
          <p className="mt-3 text-lg leading-relaxed text-muted">{intro}</p>
          <ul className="mt-5 space-y-3 text-[15px] leading-relaxed">{points}</ul>
        </div>
        <div className={flip ? 'lg:order-1' : ''}>{media}</div>
      </div>
    </section>
  )
}

export default function How() {
  return (
    <div className="min-h-screen bg-foam">
      <TopBar title="How it works" right={<DonateButton />} />

      <header className="bg-pink text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-14 pt-10 text-center">
          <img src="/images/logo.png" alt="iTaste Beer Tasting" className="w-32 drop-shadow-xl" />
          <h1 className="mt-5 font-display text-5xl leading-none sm:text-6xl">How a tasting works</h1>
          <p className="mt-3 max-w-xl text-lg text-white/90">
            No more typing scores into a spreadsheet at the end of the night. The host runs the show from a TV, everyone rates on their own phone, and the results are ready the moment the last vote is in.
          </p>
          <ol className="mt-9 grid w-full gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex h-full gap-3 rounded-2xl bg-white/15 p-4 ring-1 ring-white/25 transition hover:bg-white/20">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white pt-0.5 font-display text-xl text-pink">{s.n}</span>
                  <span>
                    <span className="block font-bold">{s.title}</span>
                    <span className="block text-sm text-white/85">{s.text}</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <Section
          id="create"
          n={1}
          eyebrow="For the host"
          title="Create a room"
          intro="Give the room a name and a four digit pin. You get a room code that your guests use to join."
          points={
            <>
              <Point title="Pick the beers.">Search by beer or brewery. Not there? Press Search Untappd. Beers are tasted in the order you add them.</Point>
              <Point title="Choose how to rate.">Add categories like taste, aroma and look, and give each one a weight. The weights must add up to 100%.</Point>
              <Point title="Blind tasting?">Tick the box and choose a reveal code. Beer names stay hidden until you reveal them.</Point>
            </>
          }
          media={
            <div className="grid gap-4">
              <Screenshot src="setup-beers.jpg" alt="Room setup with three beers in the tasting order" crop="aspect-[16/9]" />
              <Screenshot src="setup-categories.jpg" alt="Rating categories with weights that add up to 100 percent" crop="aspect-[16/7]" />
            </div>
          }
        />

        <Section
          id="dashboard"
          n={2}
          flip
          eyebrow="On the big screen"
          title="Open the dashboard"
          intro="Put the dashboard on a TV, or share your screen if the tasting is remote. The room code is shown big at the top so everyone can join."
          points={
            <>
              <Point title="Guests join on their phone.">They go to itaste.beer, press Join and type the room code, the pin and their name. No app needed.</Point>
              <Point title="Watch them arrive.">Every taster pops up on the dashboard as they join.</Point>
              <Point title="Lost the tab?">Press Open the TV dashboard on the front page and enter the room code and pin.</Point>
            </>
          }
          media={<Screenshot src="dashboard-waiting.jpg" alt="Dashboard waiting for tasters with the room code at the top" />}
        />

        <Section
          id="rate"
          n={3}
          eyebrow="Everyone"
          title="Taste and rate"
          intro="The host clicks a beer on the dashboard to open it. It opens on every phone at the same moment."
          points={
            <>
              <Point title="Score each category 0 to 10.">Your total is weighted by the categories, so it is always out of 10.</Point>
              <Point title="Add a comment.">It shows up on the dashboard next to your score. In a blind tasting, use it to guess the beer.</Point>
              <Point title="Changed your mind?">Update your review until the host opens the next beer.</Point>
              <Point title="Live on the TV.">A bell rings for each vote. Green scores beat the taster's own average, red ones are below it.</Point>
            </>
          }
          media={
            <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)]">
              <Screenshot src="phone-rating.jpg" alt="Rating a beer on a phone with 0 to 10 buttons per category" phone />
              <Screenshot src="dashboard-live.jpg" alt="Dashboard showing every taster's scores for the current beer" />
            </div>
          }
        />

        <Section
          id="reveal"
          n={4}
          flip
          eyebrow="The best part"
          title="Reveal the score"
          intro="When everyone has voted, the host presses Review finished. The dashboard builds up to the result, with a sound effect to match."
          points={
            <>
              <Point title="Highest and lowest.">See who loved it and who did not.</Point>
              <Point title="Final score and ranking.">The average of every taster, and where the beer lands so far.</Point>
              <Point title="Leaderboard.">Every finished beer, ranked, with category averages and a weighted score where outliers count less.</Point>
              <Point title="On the phones too.">Tasters see the final score next to their own.</Point>
            </>
          }
          media={
            <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)]">
              <Screenshot src="dashboard-reveal.jpg" alt="Score reveal with highest and lowest rating, final score and ranking" />
              <Screenshot src="phone-list.jpg" alt="Phone showing the final score next to your own" phone crop="aspect-[390/420]" />
            </div>
          }
        />

        <Section
          id="blind"
          eyebrow="Extra"
          title="Blind tastings"
          intro="In a blind room, the dashboard and the phones show question marks instead of beer names and labels."
          points={
            <>
              <Point title="Reveal when you are ready.">Press the eye at the top of the dashboard and type the reveal code.</Point>
              <Point title="Let them guess.">Tasters can write their guess in the comment field.</Point>
            </>
          }
          media={<Screenshot src="dashboard-blind.jpg" alt="Blind tasting dashboard with hidden beer names" />}
        />

        <section className="py-12 sm:py-16">
          <h2 className="font-display text-5xl leading-none">Good to know</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Back in the room', 'Closed the browser by accident? The front page lets you pick up where you left off.'],
              ['Remove a taster', 'Hover a name in the taster list on the dashboard before the first beer is opened.'],
              ['Any screen works', 'The dashboard runs in any browser: a TV, a laptop or a shared screen on a video call.'],
            ].map(([title, text]) => (
              <div key={title} className="panel p-5">
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1 text-[15px] text-muted">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16 rounded-3xl bg-ink px-6 py-10 text-center text-white sm:px-12">
          <h2 className="font-display text-5xl leading-none">Ready to taste?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Made by Gumbo, because every tasting used to end with an hour of waiting while the host typed results into Excel. Bugs or ideas:{' '}
            <a className="font-semibold text-white underline" href="mailto:gumbosveins@gmail.com">gumbosveins@gmail.com</a>
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/create" className="rounded-[14px] bg-pink px-6 py-3.5 font-bold text-white transition hover:bg-pink-dark">Create a room</Link>
            <Link to="/join" className="rounded-[14px] bg-white px-6 py-3.5 font-bold text-ink transition hover:bg-foam">Join with a code</Link>
          </div>
        </section>
      </main>
    </div>
  )
}
