
import React from 'react';
import type { Point, Edge, OptimizedRoute } from '../types';

interface MapProps {
  pontos: Point[];
  rotas: Edge[];
  optimizedRoutes: OptimizedRoute[] | null;
}

const Map: React.FC<MapProps> = ({ pontos, rotas, optimizedRoutes }) => {
  const padding = 20;
  const width = 500;
  const height = 500;

  const allX = pontos.map(p => p.coord_x);
  const allY = pontos.map(p => p.coord_y);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);

  const scaleX = (x: number) => padding + ((x - minX) / (maxX - minX)) * (width - 2 * padding);
  const scaleY = (y: number) => padding + ((y - minY) / (maxY - minY)) * (height - 2 * padding);

  // FIX: Use `globalThis.Map` to avoid a name collision with the `Map` component.
  const pointMap = new globalThis.Map(pontos.map(p => [p.ponto, { x: scaleX(p.coord_x), y: scaleY(p.coord_y) }]));

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* All possible routes (faint) */}
        {rotas.map((rota, i) => {
          const p1 = pointMap.get(rota.origem);
          const p2 = pointMap.get(rota.destino);
          if (!p1 || !p2) return null;
          return (
            <line
              key={`rota-${i}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              className="stroke-slate-200 dark:stroke-slate-600"
              strokeWidth="1"
            />
          );
        })}

        {/* FIX: Replaced duplicated and buggy route rendering logic with a single, correct implementation using <path> for efficiency and correctness. */}
        {optimizedRoutes?.map(route => {
          if (route.sequencia.length < 2) {
            return null;
          }
          const pathData = route.sequencia
            .map((ponto, index) => {
              const point = pointMap.get(ponto);
              if (!point) return null;
              const command = index === 0 ? 'M' : 'L';
              return `${command} ${point.x} ${point.y}`;
            })
            .filter(Boolean)
            .join(' ');

          if (!pathData) return null;
          
          return (
            <path
              key={`opt-path-${route.entregador}`}
              d={pathData}
              stroke={route.cluster.color}
              strokeWidth="3"
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}

        {/* All points */}
        {pontos.map(ponto => {
          const p = pointMap.get(ponto.ponto);
          if (!p) return null;
          const isSaborExpress = ponto.ponto === 'Sabor Express';
          const cluster = optimizedRoutes?.find(r => r.cluster.pedidos.some(ped => ped.ponto_entrega === ponto.ponto))?.cluster;
          const fillColor = cluster ? cluster.color : (isSaborExpress ? '#FBBF24' : '#64748B');

          return (
            <g key={`point-${ponto.ponto}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isSaborExpress ? 7 : 5}
                fill={fillColor}
                className="stroke-white dark:stroke-slate-900"
                strokeWidth="2"
              />
              <text
                x={p.x}
                y={p.y - 12}
                textAnchor="middle"
                className="text-xs font-semibold fill-slate-700 dark:fill-slate-300"
              >
                {ponto.ponto}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default Map;
