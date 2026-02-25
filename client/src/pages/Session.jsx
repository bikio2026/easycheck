import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { socket } from '../lib/socket';
import MenuView from '../components/MenuView';
import OrdersView from '../components/OrdersView';
import BillView from '../components/BillView';
import DinerBar from '../components/DinerBar';
import { UtensilsCrossed, ClipboardList, Receipt, Copy, Check } from 'lucide-react';

const TABS = [
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'orders', label: 'Pedidos', icon: ClipboardList },
  { id: 'bill', label: 'Cuenta', icon: Receipt },
];

export default function Session() {
  const { sessionId } = useParams();
  const [data, setData] = useState(null);
  const [menu, setMenu] = useState([]);
  const [tab, setTab] = useState('menu');
  const [paidOrders, setPaidOrders] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const diner = JSON.parse(localStorage.getItem('easycheck_diner') || 'null');

  const refresh = useCallback(async () => {
    try {
      const [sessionData, paid] = await Promise.all([
        api.getSession(sessionId),
        api.getPaidOrders(sessionId),
      ]);
      setData(sessionData);
      setPaidOrders(paid);
      if (!menu.length && sessionData.session.restaurant_id) {
        const m = await api.getMenu(sessionData.session.restaurant_id);
        setMenu(m);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sessionId, menu.length]);

  useEffect(() => {
    refresh();
    socket.connect();
    socket.emit('join:session', sessionId);

    socket.on('diner:joined', () => refresh());
    socket.on('orders:updated', () => refresh());
    socket.on('payment:made', () => refresh());
    socket.on('session:closed', () => refresh());

    return () => {
      socket.off('diner:joined');
      socket.off('orders:updated');
      socket.off('payment:made');
      socket.off('session:closed');
      socket.disconnect();
    };
  }, [sessionId, refresh]);

  function copyCode() {
    if (!data?.session.invite_code) return;
    navigator.clipboard.writeText(data.session.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Cargando mesa...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 text-center">
        <p className="text-danger">No se encontro la sesion</p>
      </div>
    );
  }

  const { session, table, diners, orders, payments } = data;
  const isClosed = session.status === 'closed';

  return (
    <div className="min-h-dvh flex flex-col bg-surface-alt pb-20">
      {/* Header */}
      <header className="bg-primary text-white px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="font-bold text-lg">🧾 {table?.label || 'Mesa'}</h1>
            {isClosed && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Cerrada</span>}
          </div>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm font-mono transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {session.invite_code}
          </button>
        </div>
      </header>

      {/* Diners */}
      <DinerBar diners={diners} currentDinerId={diner?.id} />

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4">
        {tab === 'menu' && !isClosed && (
          <MenuView
            menu={menu}
            sessionId={sessionId}
            dinerId={diner?.id}
            onOrdered={() => { refresh(); setTab('orders'); }}
          />
        )}
        {tab === 'orders' && (
          <OrdersView
            orders={orders}
            diners={diners}
            currentDinerId={diner?.id}
            paidOrders={paidOrders}
          />
        )}
        {tab === 'bill' && (
          <BillView
            orders={orders}
            diners={diners}
            payments={payments}
            paidOrders={paidOrders}
            currentDinerId={diner?.id}
            sessionId={sessionId}
            isClosed={isClosed}
            onPaid={refresh}
          />
        )}
        {tab === 'menu' && isClosed && (
          <div className="text-center py-12 text-text-muted">
            <p className="text-4xl mb-2">🔒</p>
            <p>Esta mesa ya esta cerrada</p>
          </div>
        )}
      </main>

      {/* Tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-20">
        <div className="flex max-w-lg mx-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                tab === id ? 'text-primary' : 'text-text-muted hover:text-text'
              }`}
            >
              <Icon size={20} />
              {label}
              {id === 'orders' && orders.length > 0 && (
                <span className="absolute -top-0 right-1/4 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {orders.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
