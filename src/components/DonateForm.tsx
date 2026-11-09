export function DonateForm({ buttonId }: { buttonId: string }) {
  return (
    <form action="https://www.paypal.com/donate" method="post" target="_top" className="mt-4 flex justify-center">
      <input type="hidden" name="hosted_button_id" value={buttonId} />
      <button type="submit" className="rounded-full bg-[#ffc439] px-6 py-2.5 text-sm font-bold text-[#003087] shadow transition hover:brightness-95">
        Donate with PayPal
      </button>
    </form>
  )
}
