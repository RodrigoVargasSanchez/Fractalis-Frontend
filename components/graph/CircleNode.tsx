import { Handle, Position } from "reactflow";

export const CircleNode = ({ data }: any) => {
  const baseScale = data.scale || 1;
  const visualScale = data.isFocused ? baseScale * 1.3 : baseScale;
  
  // Lógica de Multi-bordes:
  // Creamos anillos concéntricos usando box-shadow. 
  // Cada mención agrega un anillo hacia afuera.
  const generateMultiBorder = () => {
    if (!data.coloresMenciones || data.coloresMenciones.length <= 1) {
      return data.isFocused 
        ? `0 0 80px ${data.color}, 0 0 30px white` 
        : '0 25px 50px rgba(0,0,0,0.5)';
    }

    // El primer color es el fondo, empezamos desde el segundo para los bordes
    let shadows = [];
    let spread = 0;
    
    // Anillo de enfoque si es el nodo actual
    if (data.isFocused) {
      shadows.push(`0 0 40px white`);
    }

    // Generamos los anillos de colores
    // box-shadow: 0 0 0 spread color
    data.coloresMenciones.forEach((color: string, idx: number) => {
      if (idx === 0) return; // El primero es el color de fondo del nodo
      spread += 6; // Grosor de cada anillo
      shadows.push(`0 0 0 ${spread}px ${color}`);
    });

    // Añadimos la sombra de profundidad al final
    shadows.push(`0 ${25 + spread}px 50px rgba(0,0,0,0.5)`);
    
    return shadows.join(', ');
  };

  return (
    <div 
      className="node-wrapper anim-fade-in" 
      style={{ 
        position: 'relative', 
        zIndex: data.isFocused ? 1000 : 1,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 'none', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} />
      
      <div
        className={`perfect-circle ${data.isFocused ? 'is-focused' : ''}`}
        style={{
          backgroundColor: data.color || "#57606f",
          // Mantenemos un borde blanco sutil si está enfocado
          border: data.isFocused ? '4px solid white' : '2px solid rgba(255,255,255,0.2)',
          transform: `scale(${visualScale})`,
          // Aplicamos la magia de los multi-bordes aquí
          boxShadow: generateMultiBorder(),
          transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)', 
          zIndex: 2,
          position: 'relative'
        }}
      >
        <div className={`label-container px-2 leading-tight transition-all duration-500 ${data.isFocused ? 'text-[15px] font-black' : 'text-[11px]'}`}>
          {data.label}
          
          {data.mencionesCount > 1 && (
             <div className={`mt-1 font-bold ${data.isFocused ? 'text-[12px] opacity-100' : 'text-[9px] opacity-70'}`}>
               ×{data.mencionesCount}
             </div>
          )}
        </div>
        
        {data.ronda && (
          <div className="absolute -top-2 -right-2 bg-white text-black text-[10px] font-bold px-1.5 rounded-full border border-black shadow-lg z-10">
            R{data.ronda}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 'none', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} />
    </div>
  );
};