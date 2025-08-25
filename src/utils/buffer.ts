export function bitwiseAnd(
  a: Buffer,
  b: Buffer,
  isLooping: boolean = false
): Buffer {
  const length: number = isLooping ? b.length : a.length;

  const result: Buffer = Buffer.alloc(length);

  for (let i: number = 0; i < length; i++) {
    const j = isLooping ? i % a.length : i;
    result[i] = a[j]! & b[i]!;
  }

  return result;
}

export function findNearestNonEmpty(
  map: Buffer,
  idx: number,
  width: number,
  height: number
): number {
  const x = idx % width;
  const y = Math.floor(idx / width);

  const visited = new Set<number>();
  const queue: Array<{ x: number; y: number; distance: number }> = [
    { x, y, distance: 0 },
  ];
  const directions: Array<[number, number]> = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentIdx = current.y * width + current.x;

    if (visited.has(currentIdx)) continue;
    visited.add(currentIdx);

    // 检查当前像素是否为非空白像素
    if (map[currentIdx] === 0) {
      return currentIdx;
    }

    // 添加邻近像素到队列
    for (const direction of directions) {
      const [dx, dy] = direction;
      const newX = current.x + dx;
      const newY = current.y + dy;
      const newIdx = newY * width + newX;

      if (
        newX >= 0 &&
        newX < width &&
        newY >= 0 &&
        newY < height &&
        !visited.has(newIdx)
      ) {
        queue.push({ x: newX, y: newY, distance: current.distance + 1 });
      }
    }
  }
  return -1;
}
