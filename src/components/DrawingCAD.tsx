import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text } from 'react-konva';
import { MousePointer2, Square, Circle as CircleIcon, Type, Minus, Eraser, Download, Grid, Layers, FileText } from 'lucide-react';
import { translations, Language } from '../lib/i18n';
import jsPDF from 'jspdf';

type Tool = 'select' | 'rect' | 'circle' | 'line' | 'text' | 'eraser';

interface Shape {
  id: string;
  type: Tool;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
  text?: string;
  color: string;
}

export default function DrawingCAD({ lang = 'en' }: { lang?: Language }) {
  const t = translations[lang];
  const [tool, setTool] = useState<Tool>('line');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#f97316'); // Brand Accent
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight || 600
      });
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight || 600
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: any) => {
    if (tool === 'select') return;
    
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    
    const newShape: Shape = {
      id: Date.now().toString(),
      type: tool,
      x: pos.x,
      y: pos.y,
      color: color,
      points: [pos.x, pos.y],
      width: 0,
      height: 0,
      text: tool === 'text' ? 'Engineering Note' : undefined
    };
    
    setShapes([...shapes, newShape]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastShape = shapes[shapes.length - 1];
    
    if (tool === 'line') {
      lastShape.points = [lastShape.x, lastShape.y, point.x, point.y];
    } else if (tool === 'rect') {
      lastShape.width = point.x - lastShape.x;
      lastShape.height = point.y - lastShape.y;
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(point.x - lastShape.x, 2) + Math.pow(point.y - lastShape.y, 2));
      lastShape.width = radius; // Using width as radius
    }
    
    shapes.splice(shapes.length - 1, 1, lastShape);
    setShapes([...shapes]);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const downloadImage = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = 'blueprint-design.png';
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const uri = stageRef.current.toDataURL();
    const pdf = new jsPDF('l', 'px', [dimensions.width, dimensions.height]);
    pdf.addImage(uri, 'PNG', 0, 0, dimensions.width, dimensions.height);
    pdf.save('drawing-blueprint.pdf');
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-8 gap-4">
        <div className="space-y-4">
          <h2 className="font-serif italic text-6xl text-brand-primary tracking-tight gradient-text leading-tight">{t.cadDrawing}</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-40">2D Drafting Engine // Vector Precision // Scale 1:1</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setShapes([])} className="p-3 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all">
             <Eraser size={20} />
           </button>
           <button onClick={downloadImage} className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-brand-accent rounded-xl font-mono text-[10px] uppercase tracking-widest font-black transition-all hover:bg-white/10">
             <Download size={16} />
             PNG
           </button>
           <button onClick={exportPDF} className="flex items-center gap-2 px-6 py-3 bg-brand-accent text-white rounded-xl font-mono text-[10px] uppercase tracking-widest font-black shadow-lg shadow-brand-accent/20">
             <FileText size={16} />
             PDF
           </button>
        </div>
      </header>

      <div className="flex-1 flex gap-6 overflow-hidden min-h-[500px]">
        {/* Toolbar */}
        <div className="w-20 glass-panel rounded-3xl flex flex-col items-center py-8 gap-6 border-white/5">
          <ToolBtn active={tool === 'select'} onClick={() => setTool('select')} icon={<MousePointer2 size={20} />} label="Select" />
          <div className="w-8 h-px bg-white/10"></div>
          <ToolBtn active={tool === 'line'} onClick={() => setTool('line')} icon={<Minus size={20} />} label="Line" />
          <ToolBtn active={tool === 'rect'} onClick={() => setTool('rect')} icon={<Square size={20} />} label="Rect" />
          <ToolBtn active={tool === 'circle'} onClick={() => setTool('circle')} icon={<CircleIcon size={20} />} label="Circle" />
          <ToolBtn active={tool === 'text'} onClick={() => setTool('text')} icon={<Type size={20} />} label="Text" />
          <div className="w-8 h-px bg-white/10"></div>
          <div className="flex flex-col gap-3">
            <ColorBtn active={color === '#f97316'} color="#f97316" onClick={() => setColor('#f97316')} />
            <ColorBtn active={color === '#38bdf8'} color="#38bdf8" onClick={() => setColor('#38bdf8')} />
            <ColorBtn active={color === '#10b981'} color="#10b981" onClick={() => setColor('#10b981')} />
            <ColorBtn active={color === '#ffffff'} color="#ffffff" onClick={() => setColor('#ffffff')} />
          </div>
        </div>

        {/* Canvas Area */}
        <div ref={containerRef} className="flex-1 bg-slate-950 rounded-[2.5rem] border-2 border-white/5 overflow-hidden relative shadow-inner cursor-crosshair">
          <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
          
          <Stage
            width={dimensions.width}
            height={dimensions.height}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            ref={stageRef}
          >
            <Layer>
              {shapes.map((shape) => {
                if (shape.type === 'rect') {
                  return (
                    <Rect
                      key={shape.id}
                      x={shape.x}
                      y={shape.y}
                      width={shape.width}
                      height={shape.height}
                      stroke={shape.color}
                      strokeWidth={2}
                    />
                  );
                } else if (shape.type === 'circle') {
                  return (
                    <Circle
                      key={shape.id}
                      x={shape.x}
                      y={shape.y}
                      radius={shape.width}
                      stroke={shape.color}
                      strokeWidth={2}
                    />
                  );
                } else if (shape.type === 'line') {
                  return (
                    <Line
                      key={shape.id}
                      points={shape.points}
                      stroke={shape.color}
                      strokeWidth={2}
                      lineCap="round"
                    />
                  );
                } else if (shape.type === 'text') {
                  return (
                    <Text
                      key={shape.id}
                      x={shape.x}
                      y={shape.y}
                      text={shape.text}
                      fontSize={16}
                      fill={shape.color}
                      fontFamily="JetBrains Mono"
                    />
                  );
                }
                return null;
              })}
            </Layer>
          </Stage>

          {/* Status Bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 glass-panel rounded-2xl flex items-center gap-6 border-white/10">
             <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-slate-400">
               <Grid size={12} /> GRID_SNAP: OFF
             </div>
             <div className="w-px h-4 bg-white/10"></div>
             <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-slate-400">
               <Layers size={12} /> LAYER: SITE_BASE
             </div>
             <div className="w-px h-4 bg-white/10"></div>
             <div className="font-mono text-[9px] uppercase tracking-widest text-brand-accent font-black">
               {tool.toUpperCase()}_MODE
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      title={label}
      className={`p-3 rounded-2xl transition-all ${active ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20 scale-110' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
    >
      {icon}
    </button>
  );
}

function ColorBtn({ active, color, onClick }: { active: boolean, color: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-4 h-4 rounded-full transition-all ring-offset-2 ring-offset-slate-900 ${active ? 'ring-2 ring-brand-accent scale-125' : 'hover:scale-110'}`}
      style={{ backgroundColor: color }}
    />
  );
}
