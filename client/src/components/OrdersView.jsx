import { CheckCircle } from 'lucide-react';

export default function OrdersView({ orders, diners, currentDinerId, paidOrders }) {
  if (!orders.length) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p className="text-4xl mb-2">📋</p>
        <p>Todavia no hay pedidos</p>
        <p className="text-xs mt-1">Anda al menu para hacer tu pedido</p>
      </div>
    );
  }

  // Group by diner
  const byDiner = {};
  for (const o of orders) {
    if (!byDiner[o.diner_id]) byDiner[o.diner_id] = [];
    byDiner[o.diner_id].push(o);
  }

  return (
    <div className="space-y-4">
      {Object.entries(byDiner).map(([dinerId, dinerOrders]) => {
        const d = diners.find(x => x.id === dinerId);
        const isMe = dinerId === currentDinerId;
        const total = dinerOrders.reduce((s, o) => s + o.price * o.quantity, 0);

        return (
          <div key={dinerId} className="bg-white rounded-xl border border-border overflow-hidden">
            <div className={`px-4 py-2 flex items-center justify-between ${isMe ? 'bg-primary/5' : 'bg-gray-50'}`}>
              <span className="font-medium text-sm">
                {d?.avatar} {isMe ? 'Tus pedidos' : d?.name}
              </span>
              <span className="text-sm font-semibold text-primary">
                ${total.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="divide-y divide-border">
              {dinerOrders.map(o => {
                const isPaid = paidOrders.includes(o.id);
                return (
                  <div key={o.id} className={`px-4 py-2.5 flex items-center gap-3 ${isPaid ? 'opacity-50' : ''}`}>
                    <span className="text-lg shrink-0">{o.item_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {o.quantity > 1 && `${o.quantity}x `}{o.item_name}
                      </p>
                      {o.notes && <p className="text-xs text-text-muted italic">{o.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm">${(o.price * o.quantity).toLocaleString('es-AR')}</span>
                      {isPaid && <CheckCircle size={14} className="text-success" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
