import { useEffect, useRef } from 'react'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { API_URL } from './api'

type Handlers = Record<string, (payload: never) => void>

/**
 * Connects to the BeerHub, joins the room group and keeps it joined across reconnects.
 * joinMethod is "JoinRoom" for the dashboard and "JoinRoomAsUser" for tasters.
 */
export function useBeerHub(roomCode: string | undefined, joinMethod: 'JoinRoom' | 'JoinRoomAsUser', handlers: Handlers): void {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

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

    const join = () => connection.invoke(joinMethod, roomCode).catch((err: unknown) => console.error('Hub join failed', err))
    connection.onreconnected(() => {
      void join()
    })

    let cancelled = false
    connection
      .start()
      .then(() => {
        if (!cancelled) {
          void join()
        }
      })
      .catch((err: unknown) => console.error('Hub connection failed', err))

    return () => {
      cancelled = true
      void connection.stop()
    }
  }, [roomCode, joinMethod])
}
