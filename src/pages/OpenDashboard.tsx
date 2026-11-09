import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button, Card, Field, FormPage } from '../components/ui'
import { readSession } from '../lib/session'

export default function OpenDashboard() {
  const navigate = useNavigate()
  const session = readSession()
  const [roomCode, setRoomCode] = useState(session.userId ? '' : (session.roomCode ?? ''))
  const [pin, setPin] = useState(session.userId ? '' : (session.pin ?? ''))
  const valid = roomCode.length === 4 && /^\d{4}$/.test(pin)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (valid) {
      navigate(`/dashboard/${roomCode}/${pin}`)
    }
  }

  return (
    <FormPage title="Open Dashboard">
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
            className="font-mono text-xl tracking-[0.4em] uppercase"
            autoComplete="off"
            required
            autoFocus
          />
          <Field label="Room pin" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" required />
          <Button type="submit" className="w-full" disabled={!valid}>
            Open Dashboard
          </Button>
        </form>
      </Card>
    </FormPage>
  )
}
