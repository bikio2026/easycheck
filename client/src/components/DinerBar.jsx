export default function DinerBar({ diners, currentDinerId }) {
  return (
    <div className="bg-white border-b border-border px-4 py-2 overflow-x-auto">
      <div className="flex gap-3 max-w-lg mx-auto">
        {diners.map(d => (
          <div
            key={d.id}
            className={`flex flex-col items-center shrink-0 ${
              d.id === currentDinerId ? 'opacity-100' : 'opacity-60'
            }`}
          >
            <span className="text-2xl">{d.avatar}</span>
            <span className="text-[10px] font-medium truncate max-w-[48px]">
              {d.id === currentDinerId ? 'Vos' : d.name}
            </span>
            {d.is_host === 1 && (
              <span className="text-[8px] text-primary font-bold">HOST</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
