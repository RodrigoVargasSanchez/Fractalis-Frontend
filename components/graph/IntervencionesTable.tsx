import { useMemo } from "react";

export function IntervencionesTable({ movieSequence }: { movieSequence: any[] }) {
  const groupedIntervenciones = useMemo(() => {
    const groups: Record<string, any> = {};
    movieSequence.forEach((step) => {
      const key = step.opinionId || `${step.timestamp}-${step.authorName}`;
      if (!groups[key]) {
        groups[key] = { ...step, conceptos: [step.name] };
      } else {
        if (!groups[key].conceptos.includes(step.name)) {
          groups[key].conceptos.push(step.name);
        }
      }
    });
    return Object.values(groups);
  }, [movieSequence]);

  return (
    <div className="w-full animate-fade-in flex flex-col flex-1 min-h-0 px-8 pb-6">
      <div className="bg-[#111] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden flex flex-col flex-1">
        <div className="bg-white/5 border-b border-white/10 flex">
          <div className="p-5 w-[20%] text-[#1e90ff] uppercase text-xs font-black tracking-widest">Autor</div>
          <div className="p-5 w-[15%] text-[#1e90ff] uppercase text-xs font-black tracking-widest text-center">Timestamp</div>
          <div className="p-5 w-[45%] text-[#1e90ff] uppercase text-xs font-black tracking-widest">Opinión</div>
          <div className="p-5 w-[20%] text-[#1e90ff] uppercase text-xs font-black tracking-widest">Conceptos</div>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed">
            <tbody className="divide-y divide-white/5">
              {groupedIntervenciones.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-5 align-top w-[20%]">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.authorColor }} />
                      <span className="font-bold text-sm truncate">{item.authorName}</span>
                    </div>
                  </td>
                  <td className="p-5 text-gray-500 text-xs font-mono text-center align-top w-[15%]">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-5 text-gray-300 text-sm italic leading-relaxed align-top w-[45%] break-words">
                    "{item.opinionContent}"
                  </td>
                  <td className="p-5 align-top w-[20%]">
                    <div className="flex flex-col items-start gap-2">
                      {item.conceptos.map((conc: string, cIdx: number) => (
                        <span key={cIdx} className="inline-block bg-[#1e90ff]/10 text-[#1e90ff] px-3 py-1 rounded-full text-[10px] font-black uppercase border border-[#1e90ff]/20 shadow-sm">
                          {conc}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(30, 144, 255, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
}