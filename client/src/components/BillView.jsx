import { useState, useMemo } from 'react';
import { api } from '../lib/api';
import { CheckCircle, CreditCard, Users, Percent, ListChecks } from 'lucide-react';

const TIP_OPTIONS = [0, 10, 15, 20];
const SPLIT_MODES = [
  { id: 'items', label: 'Por items', icon: ListChecks, desc: 'Paga solo lo tuyo' },
  { id: 'equal', label: 'Partes iguales', icon: Users, desc: 'Dividir equitativamente' },
  { id: 'percent', label: 'Porcentaje', icon: Percent, desc: 'Elegir cuanto aportar' },
];

export default function BillView({ orders, diners, payments, paidOrders, currentDinerId, sessionId, isClosed, onPaid }) {
  const [splitMode, setSplitMode] = useState('items');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [tipPct, setTipPct] = useState(10);
  const [customPercent, setCustomPercent] = useState(50);
  const [paying, setPaying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const grandTotal = orders.reduce((s, o) => s + o.price * o.quantity, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount + p.tip, 0);
  const remaining = grandTotal - totalPaid + payments.reduce((s, p) => s + p.tip, 0);

  // My unpaid orders
  const myUnpaidOrders = useMemo(() =>
    orders.filter(o => o.diner_id === currentDinerId && !paidOrders.includes(o.id)),
    [orders, currentDinerId, paidOrders]
  );

  function toggleOrder(orderId) {
    setSelectedOrders(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  }

  function selectAllMine() {
    setSelectedOrders(myUnpaidOrders.map(o => o.id));
  }

  // Calculate amount based on split mode
  const payAmount = useMemo(() => {
    if (splitMode === 'items') {
      return orders
        .filter(o => selectedOrders.includes(o.id))
        .reduce((s, o) => s + o.price * o.quantity, 0);
    }
    if (splitMode === 'equal') {
      const unpaidTotal = grandTotal - payments.reduce((s, p) => s + p.amount, 0);
      const unpaidDiners = diners.filter(d => {
        const dinerPaid = payments.filter(p => p.diner_id === d.id).reduce((s, p) => s + p.amount, 0);
        const dinerTotal = orders.filter(o => o.diner_id === d.id).reduce((s, o) => s + o.price * o.quantity, 0);
        return dinerPaid < dinerTotal;
      }).length || 1;
      return Math.ceil(unpaidTotal / unpaidDiners);
    }
    if (splitMode === 'percent') {
      const unpaidTotal = grandTotal - payments.reduce((s, p) => s + p.amount, 0);
      return Math.ceil(unpaidTotal * customPercent / 100);
    }
    return 0;
  }, [splitMode, selectedOrders, orders, grandTotal, payments, diners, customPercent]);

  const tipAmount = Math.round(payAmount * tipPct / 100);
  const totalToPay = payAmount + tipAmount;

  async function handlePay() {
    if (payAmount <= 0) return;
    setPaying(true);
    try {
      let orderIds;
      if (splitMode === 'items') {
        orderIds = selectedOrders;
      } else {
        // For equal/percent, mark all unpaid orders of this diner as paid
        orderIds = myUnpaidOrders.map(o => o.id);
      }
      if (!orderIds.length) {
        // If no orders to link, use all unpaid
        orderIds = orders.filter(o => !paidOrders.includes(o.id)).map(o => o.id).slice(0, 1);
      }
      await api.createPayment({
        session_id: sessionId,
        diner_id: currentDinerId,
        order_ids: orderIds,
        tip: tipAmount,
        method: 'mercadopago',
      });
      setShowSuccess(true);
      setSelectedOrders([]);
      setTimeout(() => setShowSuccess(false), 3000);
      onPaid();
    } catch (err) {
      alert(err.message);
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-text-muted">Total de la mesa</span>
          <span className="font-semibold">${grandTotal.toLocaleString('es-AR')}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-text-muted">Ya pagado</span>
          <span className="text-success font-semibold">${totalPaid.toLocaleString('es-AR')}</span>
        </div>
        <div className="border-t border-border mt-2 pt-2 flex justify-between text-sm">
          <span className="font-semibold">Restante</span>
          <span className="font-bold text-primary">${(grandTotal - payments.reduce((s, p) => s + p.amount, 0)).toLocaleString('es-AR')}</span>
        </div>
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-text-muted uppercase">
            Pagos realizados
          </div>
          {payments.map(p => (
            <div key={p.id} className="px-4 py-2.5 flex items-center justify-between border-t border-border">
              <span className="text-sm">
                {diners.find(d => d.id === p.diner_id)?.avatar}{' '}
                {p.diner_id === currentDinerId ? 'Vos' : p.diner_name}
              </span>
              <div className="text-right">
                <span className="text-sm font-semibold text-success">${p.amount.toLocaleString('es-AR')}</span>
                {p.tip > 0 && <span className="text-xs text-text-muted ml-1">(+${p.tip.toLocaleString('es-AR')} propina)</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {isClosed ? null : (
        <>
          {/* Split mode */}
          <div className="flex gap-2">
            {SPLIT_MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => { setSplitMode(mode.id); setSelectedOrders([]); }}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all ${
                  splitMode === mode.id
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-white border-border text-text-muted hover:border-primary/30'
                }`}
              >
                <mode.icon size={18} />
                {mode.label}
              </button>
            ))}
          </div>

          {/* Items selection */}
          {splitMode === 'items' && (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase">Selecciona que pagar</span>
                <button onClick={selectAllMine} className="text-xs text-primary font-medium">
                  Seleccionar todo mio
                </button>
              </div>
              {myUnpaidOrders.length === 0 ? (
                <div className="px-4 py-6 text-center text-text-muted text-sm">
                  No tenes items pendientes de pago
                </div>
              ) : (
                myUnpaidOrders.map(o => (
                  <label
                    key={o.id}
                    className="px-4 py-2.5 flex items-center gap-3 border-t border-border cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(o.id)}
                      onChange={() => toggleOrder(o.id)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                    />
                    <span className="text-lg">{o.item_emoji}</span>
                    <span className="flex-1 text-sm">{o.quantity > 1 && `${o.quantity}x `}{o.item_name}</span>
                    <span className="text-sm font-medium">${(o.price * o.quantity).toLocaleString('es-AR')}</span>
                  </label>
                ))
              )}
            </div>
          )}

          {/* Equal split info */}
          {splitMode === 'equal' && (
            <div className="bg-white rounded-xl border border-border p-4 text-center">
              <p className="text-sm text-text-muted mb-1">Tu parte equitativa</p>
              <p className="text-2xl font-bold text-primary">${payAmount.toLocaleString('es-AR')}</p>
            </div>
          )}

          {/* Percent slider */}
          {splitMode === 'percent' && (
            <div className="bg-white rounded-xl border border-border p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-muted">Porcentaje a pagar</span>
                <span className="font-semibold">{customPercent}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={customPercent}
                onChange={e => setCustomPercent(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-center text-xl font-bold text-primary mt-2">
                ${payAmount.toLocaleString('es-AR')}
              </p>
            </div>
          )}

          {/* Tip */}
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-text-muted uppercase mb-2">Propina</p>
            <div className="flex gap-2">
              {TIP_OPTIONS.map(pct => (
                <button
                  key={pct}
                  onClick={() => setTipPct(pct)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    tipPct === pct
                      ? 'bg-accent text-white'
                      : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Pay button */}
          <button
            onClick={handlePay}
            disabled={payAmount <= 0 || paying}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg hover:bg-primary-dark transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <CreditCard size={20} />
            {paying ? 'Procesando...' : `Pagar $${totalToPay.toLocaleString('es-AR')}`}
          </button>

          {/* Success toast */}
          {showSuccess && (
            <div className="fixed top-4 left-4 right-4 z-50 bg-success text-white px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg animate-bounce max-w-lg mx-auto">
              <CheckCircle size={20} />
              <span className="font-semibold">Pago realizado con exito!</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
