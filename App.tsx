import React, { useCallback, useReducer } from 'react';
import type { OptimizedRoute, OptimizeResult, Point, Edge, Pedido } from './types';
import { PONTOS as PONTOS_PADRAO, ROTAS as ROTAS_PADRAO, PEDIDOS as PEDIDOS_PADRAO } from './constants';
import { optimizeRoutes } from './services/optimizationService';
import { parseCsvFiles } from './services/dataService';
import Map from './components/Map';
import Results from './components/Results';
import FileUpload from './components/FileUpload';

interface AppState {
  numEntregadores: number;
  optimizedRoutes: OptimizedRoute[] | null;
  warnings: string[];
  undeliverable: string[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  pontos: Point[];
  rotas: Edge[];
  pedidos: Pedido[];
  attachedFiles: File[] | null;
  dataSource: 'default' | 'csv';
}

type AppAction =
  | { type: 'SET_NUM_ENTREGADORES'; payload: number }
  | { type: 'OPTIMIZE_START' }
  | { type: 'OPTIMIZE_SUCCESS'; payload: OptimizeResult }
  | { type: 'OPTIMIZE_ERROR'; payload: string }
  | { type: 'ATTACH_FILES'; payload: File[] }
  | { type: 'LOAD_CSV_DATA_SUCCESS'; payload: { pontos: Point[]; rotas: Edge[]; pedidos: Pedido[] } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'RESET_TO_DEFAULT' };


const createInitialState = (): AppState => ({
  numEntregadores: 3,
  optimizedRoutes: null,
  warnings: [],
  undeliverable: [],
  isLoading: false,
  error: null,
  successMessage: null,
  pontos: PONTOS_PADRAO,
  rotas: ROTAS_PADRAO,
  pedidos: PEDIDOS_PADRAO,
  attachedFiles: null,
  dataSource: 'default',
});

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_NUM_ENTREGADORES':
      return { ...state, numEntregadores: action.payload };
    case 'OPTIMIZE_START':
      return {
        ...state,
        isLoading: true,
        error: null,
        successMessage: null,
        optimizedRoutes: null,
        warnings: [],
        undeliverable: [],
      };
    case 'OPTIMIZE_SUCCESS':
      return {
        ...state,
        isLoading: false,
        optimizedRoutes: action.payload.routes,
        warnings: action.payload.warnings,
        undeliverable: action.payload.undeliverable,
      };
    case 'OPTIMIZE_ERROR':
      return { ...state, isLoading: false, error: action.payload, warnings: [], undeliverable: [] };
    case 'ATTACH_FILES':
      return { ...state, attachedFiles: action.payload, error: null, successMessage: null };
    case 'LOAD_CSV_DATA_SUCCESS':
      return {
        ...state,
        dataSource: 'csv',
        pontos: action.payload.pontos,
        rotas: action.payload.rotas,
        pedidos: action.payload.pedidos,
        optimizedRoutes: null,
        warnings: [],
        undeliverable: [],
        successMessage: 'Dados dos arquivos CSV carregados e visualizados no mapa com sucesso!',
        error: null,
        attachedFiles: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, successMessage: null };
    case 'CLEAR_MESSAGES':
        return { ...state, error: null, successMessage: null };
    case 'RESET_TO_DEFAULT':
        return { ...createInitialState(), numEntregadores: state.numEntregadores };
    default:
      return state;
  }
}


const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, createInitialState());
  const { 
    optimizedRoutes,
    warnings,
    undeliverable,
    isLoading, 
    error, 
    successMessage, 
    pontos, 
    rotas, 
    attachedFiles,
    dataSource
  } = state;

  const handleFilesAttached = (files: File[]) => {
    dispatch({ type: 'ATTACH_FILES', payload: files });
  };

  const handleLoadAndVisualize = async () => {
    dispatch({ type: 'CLEAR_MESSAGES' });

    if (!attachedFiles || attachedFiles.length !== 3) {
      dispatch({ type: 'SET_ERROR', payload: 'Por favor, anexe exatamente 3 arquivos CSV (pontos, rotas e pedidos).' });
      return;
    }

    const pontosFile = attachedFiles.find(f => f.name === 'pontos.csv');
    const rotasFile = attachedFiles.find(f => f.name === 'rotas.csv');
    const pedidosFile = attachedFiles.find(f => f.name === 'pedidos.csv');

    if (!pontosFile || !rotasFile || !pedidosFile) {
      dispatch({ type: 'SET_ERROR', payload: 'Arquivos inválidos. Certifique-se de que os nomes são "pontos.csv", "rotas.csv" e "pedidos.csv".' });
      return;
    }

    try {
      const data = await parseCsvFiles({ 
        pontos: pontosFile, 
        rotas: rotasFile, 
        pedidos: pedidosFile 
      });
      dispatch({ type: 'LOAD_CSV_DATA_SUCCESS', payload: data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao processar os arquivos.';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  };

  const handleOptimize = useCallback(async () => {
    const { pedidos, numEntregadores, pontos, rotas } = state;

    dispatch({ type: 'OPTIMIZE_START' });
    
    try {
      if (pedidos.length === 0) {
        throw new Error("Não há pedidos para otimizar. Verifique seus dados.");
      }
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = optimizeRoutes(pedidos, numEntregadores, pontos, rotas);
      dispatch({ type: 'OPTIMIZE_SUCCESS', payload: result });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      dispatch({ type: 'OPTIMIZE_ERROR', payload: errorMessage });
      console.error(err);
    }
  }, [state]);

  const hasOptimizationAlerts = warnings.length > 0 || undeliverable.length > 0;

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full min-w-0">
        <header className="text-center mb-6 sm:mb-8 px-1">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Otimizador de Rotas Sabor Express
          </h1>
          <p className="mt-2 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Planejamento de Entrega Inteligente com IA
          </p>
        </header>

        <main className="space-y-6 sm:space-y-8">
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="space-y-4">

              <FileUpload onFilesAttached={handleFilesAttached} attachedFiles={attachedFiles} />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4">
                 {attachedFiles && attachedFiles.length > 0 && (
                    <button
                      onClick={handleLoadAndVisualize}
                      className="w-full sm:w-auto px-6 py-2.5 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 transition-colors"
                    >
                      Carregar e Visualizar Dados CSV
                    </button>
                 )}
                 {dataSource === 'csv' && (
                    <button
                      onClick={() => dispatch({ type: 'RESET_TO_DEFAULT' })}
                      className="w-full sm:w-auto px-6 py-2.5 font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-4 focus:ring-slate-300 dark:focus:ring-slate-600 transition-colors"
                    >
                      Resetar para Simulação
                    </button>
                 )}
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <label htmlFor="drivers" className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                    Número de Motoristas:
                  </label>
                  <input
                    type="number"
                    id="drivers"
                    value={state.numEntregadores}
                    onChange={(e) => dispatch({ type: 'SET_NUM_ENTREGADORES', payload: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    min="1"
                    max={state.pedidos.length || 1}
                    className="w-20 p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="Número de motoristas"
                  />
                  <span className="text-sm px-3 py-1 rounded-full font-medium whitespace-nowrap" style={{
                      backgroundColor: dataSource === 'csv' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                      color: dataSource === 'csv' ? '#16A34A' : '#64748B'
                    }}>
                    Fonte: {dataSource === 'csv' ? 'CSV' : 'Simulação'}
                  </span>
                </div>
                <button
                  onClick={handleOptimize}
                  disabled={isLoading}
                  className="w-full md:w-auto px-6 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 ease-in-out flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Otimizando...
                    </>
                  ) : (
                    'Otimizar Rotas'
                  )}
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 mt-4 text-center font-semibold bg-red-100 dark:bg-red-900/30 p-3 rounded-md text-sm sm:text-base break-words">{error}</p>}
            {successMessage && <p className="text-green-600 mt-4 text-center font-semibold bg-green-100 dark:bg-green-900/30 p-3 rounded-md text-sm sm:text-base break-words">{successMessage}</p>}
          </div>

          {hasOptimizationAlerts && (
            <div
              className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 sm:p-5 space-y-3"
              role="status"
              aria-live="polite"
            >
              <h2 className="text-base sm:text-lg font-bold text-amber-800 dark:text-amber-200">
                Avisos da otimização
              </h2>
              {undeliverable.length > 0 && (
                <p className="text-sm sm:text-base text-amber-900 dark:text-amber-100 break-words">
                  <span className="font-semibold">{undeliverable.length} pedido(s) inalcançável(is):</span>{' '}
                  {undeliverable.join(', ')}
                </p>
              )}
              {warnings.length > 0 && (
                <ul className="list-disc list-inside space-y-1 text-sm sm:text-base text-amber-900 dark:text-amber-100">
                  {warnings.map((warning, index) => (
                    <li key={`warning-${index}`} className="break-words">{warning}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Mobile: empilhado | Desktop (lg+): mapa e resultados lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
              <div className="min-w-0 w-full">
                <Map pontos={pontos} rotas={rotas} optimizedRoutes={optimizedRoutes} />
              </div>
              <div className="min-w-0 w-full">
                {!isLoading && optimizedRoutes === null && (
                  <div className="text-center h-full flex flex-col justify-center py-10 sm:py-16 px-4 sm:px-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2">Pronto para Planejar Suas Entregas?</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
                      Anexe seus arquivos CSV e clique em "Carregar" ou use os dados de simulação e clique em "Otimizar Rotas".
                    </p>
                  </div>
                )}

                {isLoading && (
                  <div className="text-center h-full flex flex-col justify-center py-10 sm:py-16 px-4 sm:px-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                      <h2 className="text-xl sm:text-2xl font-semibold mb-2 animate-pulse">Calculando Rotas Ótimas...</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
                        Nossa IA está agrupando os pontos de entrega e encontrando os caminhos mais curtos. Por favor, aguarde um momento.
                      </p>
                  </div>
                )}
                
                {optimizedRoutes !== null && (
                  <Results
                    optimizedRoutes={optimizedRoutes}
                    warnings={warnings}
                    undeliverable={undeliverable}
                  />
                )}
             </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;