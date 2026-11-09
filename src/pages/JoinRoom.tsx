import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button, Card, Field, FormPage } from '../components/ui'
import { api, errorMessage } from '../lib/api'
import { writeSession } from '../lib/session'

export default function JoinRoom() {
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState('')
  const [pin, setPin] = useState('')
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)

  const valid = roomCode.length === 4 && /^\d{4}$/.test(pin) && username.trim().length > 0

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid) {
      return
    }
    setBusy(true)
    try {
      const result = await api.joinRoom({ roomCode, pin: Number(pin), username: username.trim() })
      writeSession({ userId: result.userId, roomCode, pin, username: username.trim() })
      navigate(`/userRoom/${roomCode}`)
    } catch (error) {
      toast.error(errorMessage(error))
      setBusy(false)
    }
  }

  return (
    <FormPage title="Join Room">
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
            className="font-mono text-xl tracking-[0.4em] uppercase"
            autoCapitalize="characters"
            autoComplete="off"
            required
            autoFocus
          />
          <Field label="Room pin" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" required />
          <Field label="Your name" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={50} autoComplete="nickname" required />
          <Button type="submit" className="w-full" busy={busy} disabled={!valid}>
            Join Room
          </Button>
        </form>
      </Card>
    </FormPage>
  )
}
