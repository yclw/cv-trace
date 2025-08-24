import { optimize, Config } from "svgo";

export type SvgoOptions = Config;

export async function svgoOptimize(
  svgString: string,
  options?: SvgoOptions
): Promise<string> {
  const result = optimize(svgString, options);
  return result.data;
}
