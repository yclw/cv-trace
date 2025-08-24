export function bitwiseAnd(a: Buffer, b: Buffer, isLooping: boolean = false): Buffer {
	const length: number = isLooping ? b.length : a.length;

	const result: Buffer = Buffer.alloc(length);

	for (let i: number = 0; i < length; i++) {
		const j = isLooping ? i % a.length : i;
		result[i] = a[j]! & b[i]!;
	}

  return result;
}