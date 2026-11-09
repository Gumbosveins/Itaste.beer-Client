import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Toaster } from 'sonner'
import './index.css'
import Home from './pages/Home'
import How from './pages/How'
import CreateRoom from './pages/CreateRoom'
import RoomSetup from './pages/RoomSetup'
import JoinRoom from './pages/JoinRoom'
import OpenDashboard from './pages/OpenDashboard'
import TasterRoom from './pages/TasterRoom'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/howitworks" element={<How />} />
        <Route path="/create" element={<CreateRoom />} />
        <Route path="/roomcreate/:roomCode" element={<RoomSetup />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/opendashboard" element={<OpenDashboard />} />
        <Route path="/userRoom/:roomCode" element={<TasterRoom />} />
        <Route path="/dashboard/:roomCode/:pin" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    <Toaster position="bottom-right" richColors />
  </StrictMode>,
)
