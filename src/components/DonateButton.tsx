const DONATE_BUTTON_ID = '8SQV6FM9JLV86'

export function DonateButton() {
  return (
    <form action="https://www.paypal.com/donate" method="post" target="_blank">
      <input type="hidden" name="hosted_button_id" value={DONATE_BUTTON_ID} />
      <button
        type="submit"
        className="flex h-9 items-center gap-2 rounded-full border-[1.5px] border-white/70 px-4 text-[13px] font-semibold text-white transition hover:bg-white/15"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
        Donate
      </button>
    </form>
  )
}
