import React from 'react';
import type { OptimizedRoute } from '../types';

interface ResultsProps {
  optimizedRoutes: OptimizedRoute[] | null;
}

const Results: React.FC<ResultsProps> = ({ optimizedRoutes }) => {
  if (!optimizedRoutes) return null;

  const totalCost = optimizedRoutes.reduce((acc, route) => acc + route.custoTotal, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3 flex items-center">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Análise das Rotas Otimizadas
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Prezado(a) Gerente,
        </p>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Apresentamos a análise detalhada das rotas de entrega otimizadas para a operação da "Sabor Express". As otimizações implementadas visam maximizar a produtividade da nossa equipe de motoristas e minimizar os custos operacionais, permitindo-nos atender aos nossos clientes de forma mais inteligente, econômica e eficiente.
        </p>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
         Abaixo, você encontrará o detalhamento da rota para cada motorista, incluindo a sequência de paradas e o custo associado.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Detalhamento por Motorista</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {optimizedRoutes.map(route => (
            <div key={route.entregador} className="border-l-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-r-lg" style={{ borderColor: route.cluster.color }}>
              <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">
                Motorista {route.entregador}
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">(Cluster {route.cluster.pedidos.map(p => p.ponto_entrega.split(' ')[1]).join(', ')})</span>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 break-words">
                <span className="font-semibold">Sequência:</span> {route.sequencia.join(' → ')}
              </p>
              <p className="mt-2 font-semibold text-slate-800 dark:text-white">
                Custo Total da Rota: <span className="font-bold" style={{ color: route.cluster.color }}>{route.custoTotal.toFixed(2)}</span>
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xl font-bold text-right text-slate-800 dark:text-white">
            Custo Operacional Total: <span className="text-blue-500">{totalCost.toFixed(2)}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Results;