
import type { Point, Edge, Pedido, Cluster, Graph, OptimizedRoute } from '../types';
import { CLUSTER_COLORS } from '../constants';

// --- K-Means Clustering ---
const euclideanDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

const kMeans = (points: { id: string; x: number; y: number }[], k: number): number[] => {
  if (points.length < k) k = points.length;
  let centroids = points.slice(0, k).map(p => ({ x: p.x, y: p.y }));
  let assignments = new Array(points.length).fill(0);
  let changed = true;

  for (let iter = 0; iter < 100 && changed; iter++) {
    changed = false;
    // Assignment step
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

    // Update step
    const newCentroids = Array.from({ length: k }, () => ({ x: 0, y: 0, count: 0 }));
    points.forEach((point, i) => {
      const clusterIndex = assignments[i];
      newCentroids[clusterIndex].x += point.x;
      newCentroids[clusterIndex].y += point.y;
      newCentroids[clusterIndex].count++;
    });

    newCentroids.forEach((centroid, i) => {
      if (centroid.count > 0) {
        centroids[i] = { x: centroid.x / centroid.count, y: centroid.y / centroid.count };
      }
    });
  }
  return assignments;
};


// --- A* Pathfinding ---
const aStar = (graph: Graph, pontos: Point[], start: string, end: string): { path: string[]; cost: number } | null => {
  const coords = new Map(pontos.map(p => [p.ponto, { x: p.coord_x, y: p.coord_y }]));
  const heuristic = (node: string) => euclideanDistance(coords.get(node)!, coords.get(end)!);
  
  const openSet = new Set<string>([start]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  gScore.set(start, 0);

  const fScore = new Map<string, number>();
  fScore.set(start, heuristic(start));

  while (openSet.size > 0) {
    let current = '';
    let minFScore = Infinity;
    for (const node of openSet) {
      if ((fScore.get(node) ?? Infinity) < minFScore) {
        minFScore = fScore.get(node)!;
        current = node;
      }
    }
    
    if (current === end) {
      const path = [current];
      let temp = current;
      while (cameFrom.has(temp)) {
        temp = cameFrom.get(temp)!;
        path.unshift(temp);
      }
      return { path, cost: gScore.get(end) ?? Infinity };
    }

    openSet.delete(current);

    for (const neighbor in graph[current]) {
      const tentativeGScore = (gScore.get(current) ?? Infinity) + graph[current][neighbor];
      if (tentativeGScore < (gScore.get(neighbor) ?? Infinity)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeGScore);
        fScore.set(neighbor, tentativeGScore + heuristic(neighbor));
        if (!openSet.has(neighbor)) {
          openSet.add(neighbor);
        }
      }
    }
  }

  return null; // Path not found
};

// --- Main Optimization Logic ---
export const optimizeRoutes = (pedidos: Pedido[], numEntregadores: number, pontos: Point[], rotas: Edge[]): OptimizedRoute[] => {
  const coordsMap = new Map(pontos.map(p => [p.ponto, { x: p.coord_x, y: p.coord_y }]));
  const pedidoPoints = pedidos.map(p => ({
    id: p.ponto_entrega,
    ...coordsMap.get(p.ponto_entrega)!
  }));

  const clusterAssignments = kMeans(pedidoPoints, numEntregadores);
  const clusters: Cluster[] = Array.from({ length: Math.min(numEntregadores, pedidoPoints.length) }, (_, i) => ({
    clusterIndex: i,
    pedidos: [],
    color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
  }));

  pedidos.forEach((pedido, i) => {
    clusters[clusterAssignments[i]].pedidos.push(pedido);
  });
  
  const graph: Graph = {};
  pontos.forEach(p => graph[p.ponto] = {});
  rotas.forEach(r => {
    graph[r.origem][r.destino] = r.peso;
    graph[r.destino][r.origem] = r.peso;
  });

  const optimizedRoutes: OptimizedRoute[] = [];

  clusters.filter(c => c.pedidos.length > 0).forEach((cluster, index) => {
    let sequencia: string[] = ['Sabor Express'];
    let custoTotal = 0;
    let pontosNaoVisitados = [...cluster.pedidos.map(p => p.ponto_entrega)];

    let pontoAtual = 'Sabor Express';

    while (pontosNaoVisitados.length > 0) {
      let proximoPonto = '';
      let menorCusto = Infinity;

      for (const ponto of pontosNaoVisitados) {
          const result = aStar(graph, pontos, pontoAtual, ponto);
          if (result && result.cost < menorCusto) {
              menorCusto = result.cost;
              proximoPonto = ponto;
          }
      }
      
      const pathResult = aStar(graph, pontos, pontoAtual, proximoPonto);
      if (pathResult) {
        sequencia = [...sequencia, ...pathResult.path.slice(1)];
        custoTotal += pathResult.cost;
        pontoAtual = proximoPonto;
        pontosNaoVisitados = pontosNaoVisitados.filter(p => p !== proximoPonto);
      } else {
        // Could not find path, break to avoid infinite loop
        break;
      }
    }

    const retornoResult = aStar(graph, pontos, pontoAtual, 'Sabor Express');
    if (retornoResult) {
      sequencia = [...sequencia, ...retornoResult.path.slice(1)];
      custoTotal += retornoResult.cost;
    }

    optimizedRoutes.push({
      entregador: index + 1,
      cluster,
      sequencia: sequencia,
      custoTotal,
    });
  });

  return optimizedRoutes;
};
