import type { Point, Edge, Pedido, Cluster, Graph, OptimizedRoute, OptimizeResult } from '../types';
import { CLUSTER_COLORS, BASE_DEPOT_ID } from '../constants';

type Coord = { x: number; y: number };
type PathResult = { path: string[]; cost: number };

const euclideanDistance = (p1: Coord, p2: Coord) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

// --- K-Means Clustering ---
const kMeans = (points: { id: string; x: number; y: number }[], k: number): number[] => {
  if (points.length === 0) return [];

  const effectiveK = Math.max(1, Math.min(k, points.length));
  let centroids = points.slice(0, effectiveK).map(p => ({ x: p.x, y: p.y }));
  let assignments = new Array(points.length).fill(0);
  let changed = true;

  for (let iter = 0; iter < 100 && changed; iter++) {
    changed = false;

    points.forEach((point, i) => {
      let bestDist = Infinity;
      let bestCluster = 0;
      centroids.forEach((centroid, j) => {
        const dist = euclideanDistance(point, centroid);
        if (dist < bestDist) {
          bestDist = dist;
          bestCluster = j;
        }
      });
      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    });

    const newCentroids = Array.from({ length: effectiveK }, () => ({ x: 0, y: 0, count: 0 }));
    points.forEach((point, i) => {
      const clusterIndex = assignments[i];
      newCentroids[clusterIndex].x += point.x;
      newCentroids[clusterIndex].y += point.y;
      newCentroids[clusterIndex].count++;
    });

    newCentroids.forEach((centroid, i) => {
      if (centroid.count > 0) {
        centroids[i] = { x: centroid.x / centroid.count, y: centroid.y / centroid.count };
      } else {
        // Reinsere centróide vazio em um ponto aleatório para evitar cluster morto
        const fallback = points[Math.floor(Math.random() * points.length)];
        centroids[i] = { x: fallback.x, y: fallback.y };
        changed = true;
      }
    });
  }

  return assignments;
};

const buildGraph = (pontos: Point[], rotas: Edge[]): Graph => {
  const graph: Graph = {};
  for (const p of pontos) {
    graph[p.ponto] = {};
  }
  for (const r of rotas) {
    if (!graph[r.origem] || !graph[r.destino]) continue;
    if (!(r.peso > 0) || !Number.isFinite(r.peso)) continue;
    graph[r.origem][r.destino] = r.peso;
    graph[r.destino][r.origem] = r.peso;
  }
  return graph;
};

/** BFS: nós alcançáveis a partir da base no grafo. */
const getReachableFrom = (graph: Graph, start: string): Set<string> => {
  const reachable = new Set<string>();
  if (!graph[start]) return reachable;

  const queue: string[] = [start];
  reachable.add(start);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    const neighbors = graph[current] ?? {};
    for (const neighbor of Object.keys(neighbors)) {
      if (!reachable.has(neighbor)) {
        reachable.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return reachable;
};

// --- A* Pathfinding ---
const aStar = (
  graph: Graph,
  coords: Map<string, Coord>,
  start: string,
  end: string
): PathResult | null => {
  if (!graph[start] || !graph[end]) return null;
  if (start === end) return { path: [start], cost: 0 };

  const startCoord = coords.get(start);
  const endCoord = coords.get(end);
  if (!startCoord || !endCoord) return null;

  const heuristic = (node: string): number => {
    const nodeCoord = coords.get(node);
    if (!nodeCoord) return Infinity;
    return euclideanDistance(nodeCoord, endCoord);
  };

  const openSet = new Set<string>([start]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>([[start, 0]]);
  const fScore = new Map<string, number>([[start, heuristic(start)]]);

  while (openSet.size > 0) {
    let current = '';
    let minFScore = Infinity;
    for (const node of openSet) {
      const score = fScore.get(node) ?? Infinity;
      if (score < minFScore) {
        minFScore = score;
        current = node;
      }
    }

    if (!current) return null;

    if (current === end) {
      const path = [current];
      let temp = current;
      while (cameFrom.has(temp)) {
        const prev = cameFrom.get(temp);
        if (prev === undefined) break;
        temp = prev;
        path.unshift(temp);
      }
      return { path, cost: gScore.get(end) ?? Infinity };
    }

    openSet.delete(current);

    const neighbors = graph[current] ?? {};
    for (const neighbor of Object.keys(neighbors)) {
      if (!coords.has(neighbor)) continue;

      const edgeWeight = neighbors[neighbor];
      const tentativeGScore = (gScore.get(current) ?? Infinity) + edgeWeight;

      if (tentativeGScore < (gScore.get(neighbor) ?? Infinity)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeGScore);
        fScore.set(neighbor, tentativeGScore + heuristic(neighbor));
        openSet.add(neighbor);
      }
    }
  }

  return null;
};

/**
 * Otimiza rotas com K-Means + A*.
 * Retorna rotas, avisos e lista de pedidos inalcançáveis (sem falhas silenciosas).
 */
export const optimizeRoutes = (
  pedidos: Pedido[],
  numEntregadores: number,
  pontos: Point[],
  rotas: Edge[],
  baseId: string = BASE_DEPOT_ID
): OptimizeResult => {
  const warnings: string[] = [];
  const undeliverable: string[] = [];

  if (!pontos.length) {
    return {
      routes: [],
      warnings: ['Não há pontos no grafo para otimizar.'],
      undeliverable: [],
    };
  }

  if (!pedidos.length) {
    return {
      routes: [],
      warnings: ['Não há pedidos para otimizar.'],
      undeliverable: [],
    };
  }

  const coordsMap = new Map<string, Coord>();
  for (const p of pontos) {
    coordsMap.set(p.ponto, { x: p.coord_x, y: p.coord_y });
  }

  if (!coordsMap.has(baseId)) {
    return {
      routes: [],
      warnings: [`Ponto base "${baseId}" não encontrado nos pontos do mapa.`],
      undeliverable: [...new Set(pedidos.map(p => p.ponto_entrega))],
    };
  }

  const graph = buildGraph(pontos, rotas);
  const reachable = getReachableFrom(graph, baseId);

  const deliverablePedidos: Pedido[] = [];
  for (const pedido of pedidos) {
    const id = pedido.ponto_entrega;
    if (!coordsMap.has(id)) {
      undeliverable.push(id);
      continue;
    }
    if (!reachable.has(id)) {
      undeliverable.push(id);
      continue;
    }
    deliverablePedidos.push(pedido);
  }

  const uniqueUndeliverable = [...new Set(undeliverable)];
  if (uniqueUndeliverable.length > 0) {
    warnings.push(
      `${uniqueUndeliverable.length} pedido(s) inalcançável(is) a partir de "${baseId}": ${uniqueUndeliverable.join(', ')}.`
    );
  }

  if (deliverablePedidos.length === 0) {
    return {
      routes: [],
      warnings: [
        ...warnings,
        'Nenhum pedido alcançável a partir da base. Nenhuma rota foi gerada.',
      ],
      undeliverable: uniqueUndeliverable,
    };
  }

  const pedidoPoints: { id: string; x: number; y: number }[] = [];
  for (const pedido of deliverablePedidos) {
    const coords = coordsMap.get(pedido.ponto_entrega);
    if (!coords) {
      undeliverable.push(pedido.ponto_entrega);
      continue;
    }
    pedidoPoints.push({ id: pedido.ponto_entrega, x: coords.x, y: coords.y });
  }

  const pedidosUnicos = [...new Set(pedidoPoints.map(p => p.id))];
  const requestedDrivers = Number.isFinite(numEntregadores) ? Math.floor(numEntregadores) : 1;
  const k = Math.max(1, Math.min(requestedDrivers, pedidosUnicos.length));

  if (k < requestedDrivers) {
    warnings.push(
      `Número de motoristas reduzido de ${requestedDrivers} para ${k} (há apenas ${pedidosUnicos.length} cliente(s) único(s) entregável(is)).`
    );
  }

  const clusterAssignments = kMeans(pedidoPoints, k);
  const clusters: Cluster[] = Array.from({ length: k }, (_, i) => ({
    clusterIndex: i,
    pedidos: [] as Pedido[],
    color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
  }));

  deliverablePedidos.forEach((pedido, i) => {
    const assignment = clusterAssignments[i];
    if (assignment === undefined || !clusters[assignment]) return;
    clusters[assignment].pedidos.push(pedido);
  });

  const optimizedRoutes: OptimizedRoute[] = [];
  const leftoverUndeliverable = new Set<string>();

  clusters
    .filter(c => c.pedidos.length > 0)
    .forEach((cluster, index) => {
      let sequencia: string[] = [baseId];
      let custoTotal = 0;
      let pontosNaoVisitados = [...new Set(cluster.pedidos.map(p => p.ponto_entrega))];
      let pontoAtual = baseId;

      while (pontosNaoVisitados.length > 0) {
        let melhorPath: PathResult | null = null;
        let proximoPonto = '';

        for (const ponto of pontosNaoVisitados) {
          const result = aStar(graph, coordsMap, pontoAtual, ponto);
          if (result && (melhorPath === null || result.cost < melhorPath.cost)) {
            melhorPath = result;
            proximoPonto = ponto;
          }
        }

        if (!melhorPath || !proximoPonto) {
          // Clientes restantes neste cluster ficaram sem caminho (ex.: desconexão parcial)
          for (const restante of pontosNaoVisitados) {
            leftoverUndeliverable.add(restante);
          }
          break;
        }

        sequencia = [...sequencia, ...melhorPath.path.slice(1)];
        custoTotal += melhorPath.cost;
        pontoAtual = proximoPonto;
        pontosNaoVisitados = pontosNaoVisitados.filter(p => p !== proximoPonto);
      }

      const retornoResult = aStar(graph, coordsMap, pontoAtual, baseId);
      if (retornoResult) {
        sequencia = [...sequencia, ...retornoResult.path.slice(1)];
        custoTotal += retornoResult.cost;
      } else if (pontoAtual !== baseId) {
        warnings.push(
          `Motorista ${index + 1}: não foi possível retornar de "${pontoAtual}" até a base "${baseId}".`
        );
      }

      optimizedRoutes.push({
        entregador: index + 1,
        cluster,
        sequencia,
        custoTotal,
      });
    });

  if (leftoverUndeliverable.size > 0) {
    for (const id of leftoverUndeliverable) {
      if (!uniqueUndeliverable.includes(id)) {
        uniqueUndeliverable.push(id);
      }
    }
    warnings.push(
      `Durante o roteamento, ${leftoverUndeliverable.size} ponto(s) ficaram sem caminho válido: ${[...leftoverUndeliverable].join(', ')}.`
    );
  }

  return {
    routes: optimizedRoutes,
    warnings,
    undeliverable: uniqueUndeliverable,
  };
};
