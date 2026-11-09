import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button, Card, Field, FormPage } from '../components/ui'
import { api, errorMessage } from '../lib/api'
import { writeSession } from '../lib/session'

export default function CreateRoom() {
  const navigate = useNavigate()
  const [roomName, setRoomName] = useState('')
  const [pin, setPin] = useState('')
  const [blind, setBlind] = useState(false)
  const [revealCode, setRevealCode] = useState('')
  const [busy, setBusy] = useState(false)

  const pinValid = /^\d{4}$/.test(pin) && Number(pin) >= 1000
  const valid = roomName.trim().length > 0 && pinValid && (!blind || revealCode.trim().length > 0)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid) {
      return
    }
    setBusy(true)
    try {
      const result = await api.createRoom({ roomName: roomName.trim(), pin: Number(pin), blind, revealCode: revealCode.trim() })
      writeSession({ roomCode: result.roomCode, pin, userId: null, username: null })
      navigate(`/roomcreate/${result.roomCode}`)
    } catch (error) {
      toast.error(errorMessage(error))
      setBusy(false)
    }
  }

  return (
    <FormPage title="Create Room">
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Room name" value={roomName} onChange={(e) => setRoomName(e.target.value)} maxLength={50} required autoFocus />
          <Field
            label="Room pin"
            hint="Four digits, you will need it to open the dashboard"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            required
          />
          <label className="flex items-center gap-3 rounded-xl bg-amber/10 px-4 py-3">
            <input type="checkbox" checked={blind} onChange={(e) => setBlind(e.target.checked)} className="h-5 w-5 accent-pink" />
            <span>
              <span className="block font-medium">Blind tasting</span>
              <span className="block text-xs text-ink/60">Beer names stay hidden until you reveal them</span>
            </span>
          </label>
          {blind && (
            <Field label="Reveal code" hint="Do not forget this code" value={revealCode} onChange={(e) => setRevealCode(e.target.value)} required />
          )}
          <Button type="submit" className="w-full" busy={busy} disabled={!valid}>
            Create Room
          </Button>
        </form>
      </Card>
    </FormPage>
  )
}
