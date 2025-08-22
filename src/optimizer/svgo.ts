import { optimize, Config } from "svgo";

export type SvgoOptions = Config;

export async function OptimizeSvg(
  svgString: string,
  options?: SvgoOptions
): Promise<string> {
  const result = optimize(svgString, options);
  return result.data;
}
