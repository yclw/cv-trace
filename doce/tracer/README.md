# Tracer API Documentation

Tracers convert binary mask layers (`LayerData`) into vector graphics (`VectorizeResult`).

## Potrace Tracer

Converts binary mask layers into SVG vector graphics using the Potrace algorithm.

### API

```typescript
export async function potrace(
  layerData: LayerData,
  options: PotraceOptions = {}
): Promise<VectorizeResult>
```

### Parameters

The `PotraceOptions` type is directly from the potrace library and includes:

- `threshold?: number` - Threshold for edge detection (default: 0.5)
- `optTolerance?: number` - Curve optimization tolerance (default: 0.2)
- `alphaMax?: number` - Corner threshold (default: 1.0)
- `optCurve?: boolean` - Enable curve optimization (default: true)
- `turnPolicy?: 'black' | 'white' | 'left' | 'right' | 'minority' | 'majority'` - Turn policy for ambiguous pixels
- `turdSize?: number` - Suppress speckles of up to this size (default: 2)

## VTrace (Planned)

Future implementation of VTrace algorithm for vectorization.

## AutoTrace (Planned)

Future implementation of AutoTrace algorithm for vectorization.
