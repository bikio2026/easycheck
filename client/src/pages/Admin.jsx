import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { QrCode, Plus, ArrowLeft, Pencil, Trash2 } from 'lucide-react';

export default function Admin() {
  const [restaurants, setRestaurants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [qrModal, setQrModal] = useState(null);
  const [newItem, setNewItem] = useState(null);

  useEffect(() => {
    api.getRestaurants().then(setRestaurants);
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.getMenu(selected.id).then(setMenu);
    api.getTables(selected.id).then(setTables);
  }, [selected]);

  async function showQR(tableId) {
    const data = await api.getTableQR(tableId);
    setQrModal(data);
  }

  if (!selected) {
    return (
      <div className="min-h-dvh bg-surface-alt">
        <header className="bg-white border-b border-border px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Link to="/" className="text-text-muted hover:text-text"><ArrowLeft size={20} /></Link>
            <h1 className="font-bold text-lg">Panel de Administracion</h1>
          </div>
        </header>
        <main className="max-w-2xl mx-auto p-4 space-y-3">
          {restaurants.map(r => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className="w-full bg-white rounded-xl border border-border p-4 flex items-center gap-3 hover:shadow-sm transition-shadow text-left"
            >
              <span className="text-3xl">{r.logo_emoji}</span>
              <div>
                <p className="font-semibold">{r.name}</p>
                <p className="text-text-muted text-sm">/{r.slug}</p>
              </div>
            </button>
          ))}
          {!restaurants.length && (
            <p className="text-center text-text-muted py-8">Ejecuta `npm run seed` en el server para crear datos demo</p>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface-alt">
      <header className="bg-white border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="text-text-muted hover:text-text"><ArrowLeft size={20} /></button>
          <span className="text-2xl">{selected.logo_emoji}</span>
          <h1 className="font-bold text-lg">{selected.name}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Tables & QR */}
        <section>
          <h2 className="font-semibold text-sm text-text-muted uppercase tracking-wide mb-3">
            Mesas ({tables.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tables.map(t => (
              <button
                key={t.id}
                onClick={() => showQR(t.id)}
                className="bg-white rounded-xl border border-border p-3 flex items-center gap-2 hover:shadow-sm transition-shadow"
              >
                <QrCode size={18} className="text-primary shrink-0" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Menu */}
        <section>
          <h2 className="font-semibold text-sm text-text-muted uppercase tracking-wide mb-3">
            Menu
          </h2>
          {menu.map(cat => (
            <div key={cat.id} className="mb-4">
              <h3 className="font-medium text-sm text-primary mb-2">{cat.name}</h3>
              <div className="space-y-1.5">
                {cat.items.map(item => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg border border-border px-3 py-2 flex items-center gap-3"
                  >
                    <span className="text-lg">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-text-muted truncate">{item.description}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary shrink-0">
                      ${item.price.toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-1">{qrModal.table.label}</h3>
            <p className="text-text-muted text-sm mb-4">Escanea para abrir la mesa</p>
            <img src={qrModal.qr} alt="QR Code" className="mx-auto w-64 h-64" />
            <p className="text-xs text-text-muted mt-3 font-mono break-all">{qrModal.url}</p>
            <button
              onClick={() => setQrModal(null)}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
