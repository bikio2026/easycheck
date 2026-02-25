import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QrCode, Users, CreditCard, ChefHat, ArrowRight } from 'lucide-react';

export default function Home() {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white px-4 py-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">🧾 EasyCheck</h1>
        <p className="text-emerald-100 mt-1 text-sm">Dividir la cuenta nunca fue tan facil</p>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 gap-8 max-w-md mx-auto w-full">
        {/* Quick join */}
        <div className="w-full bg-white rounded-2xl shadow-sm border border-border p-6">
          <h2 className="font-semibold text-lg mb-3">Unirte a una mesa</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Codigo de invitacion"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="flex-1 px-4 py-3 border border-border rounded-xl text-center text-lg font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={() => code.length >= 4 && navigate(`/unirse?code=${code}`)}
              disabled={code.length < 4}
              className="px-4 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-primary-dark transition-colors"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="w-full">
          <h3 className="font-semibold text-text-muted text-sm uppercase tracking-wide mb-4">Como funciona</h3>
          <div className="grid gap-3">
            {[
              { icon: QrCode, title: 'Escanea el QR', desc: 'En la mesa del restaurante' },
              { icon: Users, title: 'Uni a tus amigos', desc: 'Comparti el codigo de mesa' },
              { icon: ChefHat, title: 'Pedi del menu', desc: 'Cada uno elige lo suyo' },
              { icon: CreditCard, title: 'Paga tu parte', desc: 'Division justa y transparente' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-border">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-medium text-sm">{title}</p>
                  <p className="text-text-muted text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin link */}
        <Link
          to="/admin"
          className="text-sm text-text-muted hover:text-primary transition-colors underline underline-offset-2"
        >
          Panel de administracion del restaurante
        </Link>
      </main>
    </div>
  );
}
