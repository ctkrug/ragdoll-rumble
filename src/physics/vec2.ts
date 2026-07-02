export interface Vec2 {
  x: number;
  y: number;
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(a: Vec2, s: number): Vec2 {
  return { x: a.x * s, y: a.y * s };
}

export function length(a: Vec2): number {
  return Math.sqrt(a.x * a.x + a.y * a.y);
}

export function normalize(a: Vec2): Vec2 {
  const len = length(a);
  return len === 0 ? { x: 0, y: 0 } : scale(a, 1 / len);
}
