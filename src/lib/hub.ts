import { useEffect, useRef } from 'react'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { API_URL } from './api'

type Handlers = Record<string, (payload: never) => void>

/**
 * Connects to the BeerHub, joins the room group and keeps it joined across reconnects.
 * joinMethod is "JoinRoom" for the dashboard and "JoinRoomAsUser" for tasters.
 * onJoined runs after every successful join (reconnected is true after a dropped connection),
 * so callers can refetch state they may have missed while not in the group.
 */
export function useBeerHub(
  roomCode: string | undefined,
  joinMethod: 'JoinRoom' | 'JoinRoomAsUser',
  handlers: Handlers,
  onJoined?: (reconnected: boolean) => void,
): void {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers
  const joinedRef = useRef(onJoined)
  joinedRef.current = onJoined

  useEffect(() => {
    if (!roomCode) {
      return
    }
    const connection = new HubConnectionBuilder()
      .withUrl(`${API_URL}/beerhub`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    Object.keys(handlersRef.current).forEach((event) => {
      connection.on(event, (payload: never) => handlersRef.current[event]?.(payload))
    })

    const join = (reconnected: boolean) =>
      connection
        .invoke(joinMethod, roomCode)
        .then(() => joinedRef.current?.(reconnected))
        .catch((err: unknown) => console.error('Hub join failed', err))
    connection.onreconnected(() => {
      void join(true)
    })

    let cancelled = false
    connection
      .start()
      .then(() => {
        if (!cancelled) {
          void join(false)
        }
      })
      .catch((err: unknown) => console.error('Hub connection failed', err))

    return () => {
      cancelled = true
      void connection.stop()
    }
  }, [roomCode, joinMethod])
}
