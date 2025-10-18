import React, { useCallback, useReducer } from 'react';
import type { OptimizedRoute, Point, Edge, Pedido } from './types';
import { PONTOS as PONTOS_PADRAO, ROTAS as ROTAS_PADRAO, PEDIDOS as PEDIDOS_PADRAO } from './constants';
import { optimizeRoutes } from './services/optimizationService';
import { parseCsvFiles } from './services/dataService';
import Map from './components/Map';
import Results from './components/Results';
import FileUpload from './components/FileUpload';

interface AppState {
  numEntregadores: number;
  optimizedRoutes: OptimizedRoute[] | null;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  pontos: Point[];
  rotas: Edge[];
  pedidos: Pedido[];
  attachedFiles: File[] | null;
  dataSource: 'default' | 'csv'; // Marcador para a fonte dos dados
}

type AppAction =
  | { type: 'SET_NUM_ENTREGADORES'; payload: number }
  | { type: 'OPTIMIZE_START' }
  | { type: 'OPTIMIZE_SUCCESS'; payload: OptimizedRoute[] }
  | { type: 'OPTIMIZE_ERROR'; payload: string }
  | { type: 'ATTACH_FILES'; payload: File[] }
  | { type: 'LOAD_CSV_DATA_SUCCESS'; payload: { pontos: Point[]; rotas: Edge[]; pedidos: Pedido[] } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'RESET_TO_DEFAULT' };


const createInitialState = (): AppState => ({
  numEntregadores: 3,
  optimizedRoutes: null,
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
      return { ...state, isLoading: true, error: null, successMessage: null, optimizedRoutes: null };
    case 'OPTIMIZE_SUCCESS':
      return { ...state, isLoading: false, optimizedRoutes: action.payload };
    case 'OPTIMIZE_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'ATTACH_FILES':
      return { ...state, attachedFiles: action.payload, error: null, successMessage: null };
    case 'LOAD_CSV_DATA_SUCCESS':
      return {
        ...state,
        dataSource: 'csv', // Marcador para saber a origem dos dados
        pontos: action.payload.pontos,
        rotas: action.payload.rotas,
        pedidos: action.payload.pedidos,
        optimizedRoutes: null, // Limpa resultados antigos
        successMessage: 'Dados dos arquivos CSV carregados e visualizados no mapa com sucesso!',
        error: null,
        attachedFiles: null, // Limpa a lista de arquivos anexados
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, successMessage: null };
    case 'CLEAR_MESSAGES':
        return { ...state, error: null, successMessage: null };
    case 'RESET_TO_DEFAULT':
        return { ...createInitialState(), numEntregadores: state.numEntregadores }; // Mantém o número de motoristas
    default:
      return state;
  }
}


const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, createInitialState());
  const { 
    optimizedRoutes, 
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
    // Busca os dados que estão ATUALMENTE na memória (estado) da aplicação.
    // Isso garante que a otimização sempre use os dados que o usuário está vendo no mapa.
    const { pedidos, numEntregadores, pontos, rotas } = state;

    dispatch({ type: 'OPTIMIZE_START' });
    
    try {
      if (pedidos.length === 0) {
        throw new Error("Não há pedidos para otimizar. Verifique seus dados.");
      }
      // Simula um atraso de rede para uma melhor experiência do usuário
      await new Promise(resolve => setTimeout(resolve, 500));

      const routes = optimizeRoutes(pedidos, numEntregadores, pontos, rotas);
      dispatch({ type: 'OPTIMIZE_SUCCESS', payload: routes });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      dispatch({ type: 'OPTIMIZE_ERROR', payload: errorMessage });
      console.error(err);
    }
  }, [state]); // A dependência agora é o objeto de estado inteiro, garantindo que a função sempre tenha os dados mais recentes.

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
            Otimizador de Rotas Sabor Express
          </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            Planejamento de Entrega Inteligente com IA
          </p>
        </header>

        <main className="space-y-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="space-y-4">

              <FileUpload onFilesAttached={handleFilesAttached} attachedFiles={attachedFiles} />

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                 {attachedFiles && attachedFiles.length > 0 && (
                    <button
                      onClick={handleLoadAndVisualize}
                      className="w-full sm:w-auto px-6 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 transition-colors"
                    >
                      Carregar e Visualizar Dados CSV
                    </button>
                 )}
                 {dataSource === 'csv' && (
                    <button
                      onClick={() => dispatch({ type: 'RESET_TO_DEFAULT' })}
                      className="w-full sm:w-auto px-6 py-2 font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-4 focus:ring-slate-300 dark:focus:ring-slate-600 transition-colors"
                    >
                      Resetar para Simulação
                    </button>
                 )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <label htmlFor="drivers" className="font-semibold text-slate-700 dark:text-slate-300">
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
                  <span className="text-sm px-3 py-1 rounded-full font-medium" style={{
                      backgroundColor: dataSource === 'csv' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                      color: dataSource === 'csv' ? '#16A34A' : '#64748B'
                    }}>
                    Fonte: {dataSource === 'csv' ? 'CSV' : 'Simulação'}
                  </span>
                </div>
                <button
                  onClick={handleOptimize}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-6 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 ease-in-out flex items-center justify-center"
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
            {error && <p className="text-red-500 mt-4 text-center font-semibold bg-red-100 dark:bg-red-900/30 p-3 rounded-md">{error}</p>}
            {successMessage && <p className="text-green-600 mt-4 text-center font-semibold bg-green-100 dark:bg-green-900/30 p-3 rounded-md">{successMessage}</p>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Map pontos={pontos} rotas={rotas} optimizedRoutes={optimizedRoutes} />
              <div>
                {!isLoading && !optimizedRoutes && (
                  <div className="text-center h-full flex flex-col justify-center py-16 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-semibold mb-2">Pronto para Planejar Suas Entregas?</h2>
                    <p className="text-slate-500 dark:text-slate-400">
                      Anexe seus arquivos CSV e clique em "Carregar" ou use os dados de simulação e clique em "Otimizar Rotas".
                    </p>
                  </div>
                )}

                {isLoading && (
                  <div className="text-center h-full flex flex-col justify-center py-16 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                      <h2 className="text-2xl font-semibold mb-2 animate-pulse">Calculando Rotas Ótimas...</h2>
                      <p className="text-slate-500 dark:text-slate-400">
                        Nossa IA está agrupando os pontos de entrega e encontrando os caminhos mais curtos. Por favor, aguarde um momento.
                      </p>
                  </div>
                )}
                
                {optimizedRoutes && <Results optimizedRoutes={optimizedRoutes} />}
             </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;