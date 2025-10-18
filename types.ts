
export interface Point {
  ponto: string;
  coord_x: number;
  coord_y: number;
}

export interface Edge {
  origem: string;
  destino: string;
  peso: number;
}

export interface Pedido {
  ponto_entrega: string;
}

export interface Cluster {
  clusterIndex: number;
  pedidos: Pedido[];
  color: string;
}

export interface OptimizedRoute {
  entregador: number;
  cluster: Cluster;
  sequencia: string[];
  custoTotal: number;
}

export interface Graph {
  [key: string]: { [key: string]: number };
}
