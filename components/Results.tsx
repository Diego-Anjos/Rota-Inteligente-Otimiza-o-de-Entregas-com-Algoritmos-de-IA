import React from 'react';
import type { OptimizedRoute } from '../types';

interface ResultsProps {
  optimizedRoutes: OptimizedRoute[] | null;
  warnings?: string[];
  undeliverable?: string[];
}

const Results: React.FC<ResultsProps> = ({
  optimizedRoutes,
  warnings = [],
  undeliverable = [],
}) => {
  if (!optimizedRoutes) return null;

  const totalCost = optimizedRoutes.reduce((acc, route) => acc + route.custoTotal, 0);
  const hasAlerts = warnings.length > 0 || undeliverable.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      {hasAlerts && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 p-4 sm:p-5 rounded-lg">
          <h3 className="text-base sm:text-lg font-bold text-amber-800 dark:text-amber-200 mb-2">
            Transparência da solução
          </h3>
          {undeliverable.length > 0 && (
            <p className="text-sm text-amber-900 dark:text-amber-100 mb-2 break-words">
              <span className="font-semibold">{undeliverable.length} pedido(s) inalcançável(is)</span>
              {' — '}não entraram nas rotas: {undeliverable.join(', ')}.
            </p>
          )}
          {warnings.length > 0 && (
            <ul className="list-disc list-inside text-sm text-amber-900 dark:text-amber-100 space-y-1">
              {warnings.map((w, i) => (
                <li key={`result-warning-${i}`} className="break-words">{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-3 flex items-start sm:items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Análise das Rotas Otimizadas
        </h3>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Prezado(a) Gerente,
        </p>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Apresentamos a análise detalhada das rotas de entrega otimizadas para a operação da "Sabor Express". As otimizações implementadas visam maximizar a produtividade da nossa equipe de motoristas e minimizar os custos operacionais, permitindo-nos atender aos nossos clientes de forma mais inteligente, econômica e eficiente.
        </p>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
         Abaixo, você encontrará o detalhamento da rota para cada motorista, incluindo a sequência de paradas e o custo associado.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 min-w-0">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-4">Detalhamento por Motorista</h2>

        {optimizedRoutes.length === 0 ? (
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
            Nenhuma rota pôde ser gerada com os pedidos alcançáveis. Verifique os avisos acima.
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row sm:overflow-x-auto gap-4 sm:pb-2 sm:snap-x sm:snap-mandatory -mx-1 px-1">
            {optimizedRoutes.map(route => (
              <div
                key={route.entregador}
                className="w-full sm:w-72 sm:min-w-[18rem] sm:max-w-sm sm:flex-shrink-0 sm:snap-start border-l-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-r-lg min-w-0"
                style={{ borderColor: route.cluster.color }}
              >
                <h3 className="font-bold text-base sm:text-lg text-slate-700 dark:text-slate-200 flex flex-col gap-1">
                  <span>Motorista {route.entregador}</span>
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    (Cluster {route.cluster.pedidos.map(p => p.ponto_entrega.split(' ')[1]).join(', ')})
                  </span>
                </h3>
                <div className="text-sm text-slate-600 dark:text-slate-300 mt-2 overflow-x-auto">
                  <p className="whitespace-nowrap sm:whitespace-normal sm:break-words">
                    <span className="font-semibold">Sequência:</span> {route.sequencia.join(' → ')}
                  </p>
                </div>
                <p className="mt-2 font-semibold text-slate-800 dark:text-white text-sm sm:text-base">
                  Custo Total da Rota:{' '}
                  <span className="font-bold" style={{ color: route.cluster.color }}>
                    {route.custoTotal.toFixed(2)}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-lg sm:text-xl font-bold text-left sm:text-right text-slate-800 dark:text-white break-words">
            Custo Operacional Total: <span className="text-blue-500">{totalCost.toFixed(2)}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Results;
