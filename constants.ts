
import type { Point, Edge, Pedido } from './types';

export const PONTOS: Point[] = [
  { ponto: 'Sabor Express', coord_x: 50, coord_y: 50 },
  { ponto: 'Cliente A', coord_x: 15, coord_y: 80 },
  { ponto: 'Cliente B', coord_x: 25, coord_y: 20 },
  { ponto: 'Cliente C', coord_x: 55, coord_y: 95 },
  { ponto: 'Cliente D', coord_x: 80, coord_y: 85 },
  { ponto: 'Cliente E', coord_x: 90, coord_y: 45 },
  { ponto: 'Cliente F', coord_x: 35, coord_y: 70 },
  { ponto: 'Cliente G', coord_x: 75, coord_y: 15 },
];

export const ROTAS: Edge[] = [
  { origem: 'Sabor Express', destino: 'Cliente A', peso: 35 },
  { origem: 'Sabor Express', destino: 'Cliente F', peso: 25 },
  { origem: 'Sabor Express', destino: 'Cliente B', peso: 38 },
  { origem: 'Cliente A', destino: 'Cliente C', peso: 42 },
  { origem: 'Cliente A', destino: 'Cliente F', peso: 30 },
  { origem: 'Cliente B', destino: 'Cliente G', peso: 20 },
  { origem: 'Cliente B', destino: 'Cliente F', peso: 35 },
  { origem: 'Cliente C', destino: 'Cliente D', peso: 28 },
  { origem: 'Cliente D', destino: 'Cliente E', peso: 42 },
  { origem: 'Cliente E', destino: 'Cliente G', peso: 25 },
];

export const PEDIDOS: Pedido[] = [
  { ponto_entrega: 'Cliente A' },
  { ponto_entrega: 'Cliente B' },
  { ponto_entrega: 'Cliente C' },
  { ponto_entrega: 'Cliente D' },
  { ponto_entrega: 'Cliente E' },
  { ponto_entrega: 'Cliente G' },
];

export const CLUSTER_COLORS = [
  '#A855F7', // purple-500
  '#22C55E', // green-500
  '#F97316', // orange-500
  '#3B82F6', // blue-500
  '#EF4444', // red-500
];
