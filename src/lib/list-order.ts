export function orderItems<T>(items: T[], order: string[], keyOf: (item: T) => string) {
  const positions = new Map(order.map((key, index) => [key, index]));
  return [...items].sort((a, b) => (positions.get(keyOf(a)) ?? order.length) - (positions.get(keyOf(b)) ?? order.length));
}

export function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
