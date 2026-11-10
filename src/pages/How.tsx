import type { ReactNode } from 'react'
import { Card, Logo, TopBar } from '../components/ui'
import { DonateForm } from '../components/DonateForm'

function Step({ title, image, children }: { title: string; image?: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-1 space-y-2 text-ink/75">{children}</div>
      {image && <img src={`/images/how/${image}`} alt={title} className="mt-3 w-full rounded-xl ring-1 ring-black/10" loading="lazy" />}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="mt-6">
      <h2 className="font-display text-4xl tracking-wide text-pink">{title}</h2>
      {children}
    </Card>
  )
}

export default function How() {
  return (
    <div className="min-h-screen bg-pink">
      <TopBar title="How it works" />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <Logo className="w-44" />

        <Section title="Create a room">
          <p className="mt-2 text-ink/75">
            You can create a regular tasting room or a blind tasting room. Pick a room name and a four digit pin. A blind room
            also needs a reveal code, do not forget it.
          </p>
          <Step title="Select beers" image="selectbeers.png">
            <p>Search for the beers in your tasting. They will be tasted in the order you add them.</p>
          </Step>
          <Step title="Select categories" image="category.png">
            <p>Choose how beers are rated and how much each category weighs, for example taste 50% and smell 10%. The weights must add up to 100.</p>
          </Step>
          <Step title="Finish" image="finish.png">
            <p>Press Create and the dashboard opens.</p>
          </Step>
        </Section>

        <Section title="The dashboard">
          <p className="mt-2 text-ink/75">Put the dashboard on a TV at the party, or share the host's screen if the tasting is remote.</p>
          <Step title="Left panel">
            <p>All beers in the tasting. Voting is locked until the host opens a beer, which then opens on every taster's phone. When everyone has voted the host presses Review finished.</p>
          </Step>
          <Step title="Middle panel">
            <p>Live reviews from every taster for the current beer.</p>
          </Step>
          <Step title="Right panel" image="dash.png">
            <p>The leaderboard with average and weighted average scores.</p>
          </Step>
          <Step title="Blind tasting" image="blind.png">
            <p>In a blind room the beers stay hidden. The host reveals them with the eye button and the reveal code.</p>
          </Step>
        </Section>

        <Section title="Taster view">
          <Step title="Voting" image="userroom.png">
            <p>Join with the room code, pin and your name. When the host opens a beer it opens on your phone. Add a comment, or in a blind tasting, your guess.</p>
          </Step>
        </Section>

        <Section title="Who made it">
          <p className="mt-2 text-ink/75">
            Made by Gumbo, because every beer tasting ended with an hour of waiting while the host typed results into Excel.
            Bugs, comments or feature requests: <a className="font-medium text-pink underline" href="mailto:gumbosveins@gmail.com">gumbosveins@gmail.com</a>
          </p>
          <p className="mt-2 text-ink/75">If the site made your tasting a bit better, consider a donation to cover hosting.</p>
          <DonateForm buttonId="2LEJX3PPL3A26" />
        </Section>
      </main>
    </div>
  )
}
