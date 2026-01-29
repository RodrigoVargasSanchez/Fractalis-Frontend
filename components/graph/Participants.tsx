interface ParticipantsProps {
  personColors: Record<string, string>;
}

export const Participants = ({ personColors }: ParticipantsProps) => (
  <div className="bg-[#111]/80 backdrop-blur-2xl p-6 rounded-[32px] border border-white/10 shadow-3xl min-w-[180px] m-8">
    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-5 text-center">Participantes</h3>
    <div className="flex flex-col gap-4">
      {Object.entries(personColors).map(([name, color]) => (
        <div key={name} className="flex items-center gap-4 group">
          <div className="w-5 h-5 rounded-full border-2 border-white/20 shadow-inner" style={{ backgroundColor: color }} />
          <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">{name}</span>
        </div>
      ))}
    </div>
  </div>
);