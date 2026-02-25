import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Mesa from './pages/Mesa';
import Session from './pages/Session';
import JoinByCode from './pages/JoinByCode';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mesa/:tableId" element={<Mesa />} />
        <Route path="/session/:sessionId" element={<Session />} />
        <Route path="/unirse" element={<JoinByCode />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
