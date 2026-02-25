import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { AVATARS, randomAvatar } from '../lib/avatars';

export default function Mesa() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(randomAvatar);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleJoin(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { session, diner } = await api.createSession({
        table_id: tableId,
        diner_name: name.trim(),
        avatar,
      });
      localStorage.setItem('easycheck_diner', JSON.stringify(diner));
      navigate(`/session/${session.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 bg-surface-alt">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">🧾 EasyCheck</h1>
          <p className="text-text-muted text-sm mt-1">Bienvenido a la mesa</p>
        </div>

        <form onSubmit={handleJoin} className="bg-white rounded-2xl shadow-sm border border-border p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Elegi tu avatar</label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={`text-2xl w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    avatar === a ? 'bg-primary/20 ring-2 ring-primary scale-110' : 'hover:bg-gray-100'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tu nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Martin"
              maxLength={20}
              autoFocus
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-primary-dark transition-colors"
          >
            {loading ? 'Entrando...' : 'Unirme a la mesa'}
          </button>
        </form>
      </div>
    </div>
  );
}
