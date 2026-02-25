import { useState } from 'react';
import { api } from '../lib/api';
import { Plus, Minus, ShoppingCart } from 'lucide-react';

export default function MenuView({ menu, sessionId, dinerId, onOrdered }) {
  const [cart, setCart] = useState({});
  const [notes, setNotes] = useState({});
  const [sending, setSending] = useState(false);

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);

  function addToCart(itemId) {
    setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  }

  function removeFromCart(itemId) {
    setCart(prev => {
      const next = { ...prev };
      if (next[itemId] > 1) next[itemId]--;
      else delete next[itemId];
      return next;
    });
  }

  async function placeOrder() {
    if (!cartCount) return;
    setSending(true);
    try {
      const items = Object.entries(cart).map(([menu_item_id, quantity]) => ({
        menu_item_id,
        quantity,
        notes: notes[menu_item_id] || '',
      }));
      await api.createOrders({ session_id: sessionId, diner_id: dinerId, items });
      setCart({});
      setNotes({});
      onOrdered();
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {menu.map(cat => (
        <div key={cat.id}>
          <h3 className="font-semibold text-sm text-text-muted uppercase tracking-wide mb-2">
            {cat.name}
          </h3>
          <div className="space-y-2">
            {cat.items.map(item => {
              const qty = cart[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-border p-3 flex items-center gap-3"
                >
                  <span className="text-2xl shrink-0">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-text-muted text-xs truncate">{item.description}</p>
                    <p className="text-primary font-semibold text-sm mt-0.5">
                      ${item.price.toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {qty > 0 && (
                      <>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">{qty}</span>
                      </>
                    )}
                    <button
                      onClick={() => addToCart(item.id)}
                      className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Floating cart button */}
      {cartCount > 0 && (
        <div className="fixed bottom-16 left-0 right-0 px-4 z-10">
          <button
            onClick={placeOrder}
            disabled={sending}
            className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <ShoppingCart size={18} />
            {sending ? 'Enviando...' : `Pedir ${cartCount} item${cartCount > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}
