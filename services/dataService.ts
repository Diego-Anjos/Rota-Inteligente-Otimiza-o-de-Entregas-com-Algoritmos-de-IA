import Papa from 'papaparse';
import type { Point, Edge, Pedido } from '../types';

// Type guards to validate parsed data
const isPoint = (obj: any): obj is Point => {
  return typeof obj === 'object' && obj !== null &&
    'ponto' in obj && typeof obj.ponto === 'string' &&
    'coord_x' in obj && !isNaN(parseFloat(obj.coord_x)) &&
    'coord_y' in obj && !isNaN(parseFloat(obj.coord_y));
};

const isEdge = (obj: any): obj is Edge => {
  return typeof obj === 'object' && obj !== null &&
    'origem' in obj && typeof obj.origem === 'string' &&
    'destino' in obj && typeof obj.destino === 'string' &&
    'peso' in obj && !isNaN(parseFloat(obj.peso));
};

const isPedido = (obj: any): obj is Pedido => {
  return typeof obj === 'object' && obj !== null &&
    'ponto_entrega' in obj && typeof obj.ponto_entrega === 'string';
};

const parseCsv = <T>(file: File, validator: (obj: any) => obj is T): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ',', // Explicitly set the delimiter to fix parsing issues
      complete: (results) => {
        if (results.errors.length > 0) {
          return reject(new Error(`Erro ao analisar ${file.name}: ${results.errors[0].message}`));
        }
        const validatedData = results.data.map(row => {
            if (validator(row)) {
                // Ensure numeric types are correctly cast
                if (isPoint(row)) {
                    return { ...row, coord_x: Number(row.coord_x), coord_y: Number(row.coord_y) };
                }
                if (isEdge(row)) {
                    return { ...row, peso: Number(row.peso) };
                }
                return row;
            }
            return null;
        }).filter(Boolean) as T[];

        if (validatedData.length !== results.data.length) {
            return reject(new Error(`Dados inválidos encontrados no arquivo ${file.name}. Verifique as colunas e os tipos de dados.`));
        }
        
        resolve(validatedData);
      },
      error: (error) => {
        reject(new Error(`Não foi possível ler o arquivo ${file.name}: ${error.message}`));
      }
    });
  });
};

export const parseCsvFiles = async (files: { pontos: File, rotas: File, pedidos: File }): Promise<{ pontos: Point[], rotas: Edge[], pedidos: Pedido[] }> => {
  try {
    const [pontos, rotas, pedidos] = await Promise.all([
      parseCsv<Point>(files.pontos, isPoint),
      parseCsv<Edge>(files.rotas, isEdge),
      parseCsv<Pedido>(files.pedidos, isPedido)
    ]);
    return { pontos, rotas, pedidos };
  } catch (error) {
    console.error("Erro ao processar arquivos CSV:", error);
    throw error;
  }
};