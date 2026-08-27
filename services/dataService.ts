import Papa from 'papaparse';
import type { Point, Edge, Pedido } from '../types';
import { BASE_DEPOT_ID } from '../constants';

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

/**
 * Validação semântica entre pontos, rotas e pedidos.
 * Lança erros explícitos em casos inválidos (vazios, base ausente, IDs órfãos).
 */
export const validateDataset = (
  pontos: Point[],
  rotas: Edge[],
  pedidos: Pedido[],
  baseId: string = BASE_DEPOT_ID
): void => {
  if (!Array.isArray(pontos) || pontos.length === 0) {
    throw new Error('O arquivo de pontos está vazio ou inválido. Inclua ao menos a base e os clientes.');
  }
  if (!Array.isArray(rotas) || rotas.length === 0) {
    throw new Error('O arquivo de rotas está vazio ou inválido. É necessário ao menos uma aresta no grafo.');
  }
  if (!Array.isArray(pedidos) || pedidos.length === 0) {
    throw new Error('O arquivo de pedidos está vazio ou inválido. Inclua ao menos um ponto de entrega.');
  }

  const pontoIds = new Set(pontos.map(p => p.ponto.trim()));

  if (!pontoIds.has(baseId)) {
    throw new Error(
      `O ponto base "${baseId}" não existe em pontos.csv. Adicione-o para definir a origem das rotas.`
    );
  }

  const invalidEdges: string[] = [];
  for (const rota of rotas) {
    const origem = rota.origem?.trim();
    const destino = rota.destino?.trim();
    if (!pontoIds.has(origem) || !pontoIds.has(destino)) {
      invalidEdges.push(`${origem} → ${destino}`);
    }
    if (!(rota.peso > 0) || !Number.isFinite(rota.peso)) {
      throw new Error(
        `Rota inválida (${origem} → ${destino}): o peso deve ser um número positivo.`
      );
    }
  }
  if (invalidEdges.length > 0) {
    throw new Error(
      `Rotas referenciam pontos inexistentes: ${invalidEdges.slice(0, 5).join('; ')}${
        invalidEdges.length > 5 ? ` (+${invalidEdges.length - 5} outras)` : ''
      }.`
    );
  }

  const invalidPedidos = pedidos
    .map(p => p.ponto_entrega?.trim())
    .filter(id => !id || !pontoIds.has(id));

  if (invalidPedidos.length > 0) {
    const uniqueInvalid = [...new Set(invalidPedidos)];
    throw new Error(
      `Pedidos referenciam pontos inexistentes: ${uniqueInvalid.slice(0, 5).join(', ')}${
        uniqueInvalid.length > 5 ? ` (+${uniqueInvalid.length - 5} outros)` : ''
      }.`
    );
  }
};

const parseCsv = <T>(file: File, validator: (obj: any) => obj is T): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ',',
      complete: (results) => {
        if (results.errors.length > 0) {
          return reject(new Error(`Erro ao analisar ${file.name}: ${results.errors[0].message}`));
        }

        const rows = Array.isArray(results.data) ? results.data : [];
        if (rows.length === 0) {
          return reject(new Error(`O arquivo ${file.name} está vazio. Verifique o conteúdo e os cabeçalhos.`));
        }

        const validatedData = rows.map(row => {
            if (validator(row)) {
                if (isPoint(row)) {
                    return { ...row, ponto: String(row.ponto).trim(), coord_x: Number(row.coord_x), coord_y: Number(row.coord_y) };
                }
                if (isEdge(row)) {
                    return {
                      ...row,
                      origem: String(row.origem).trim(),
                      destino: String(row.destino).trim(),
                      peso: Number(row.peso),
                    };
                }
                if (isPedido(row)) {
                    return { ...row, ponto_entrega: String(row.ponto_entrega).trim() };
                }
                return row;
            }
            return null;
        }).filter(Boolean) as T[];

        if (validatedData.length !== rows.length) {
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

    validateDataset(pontos, rotas, pedidos);

    return { pontos, rotas, pedidos };
  } catch (error) {
    console.error("Erro ao processar arquivos CSV:", error);
    throw error;
  }
};
