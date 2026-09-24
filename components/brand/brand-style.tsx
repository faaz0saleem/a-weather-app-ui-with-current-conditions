import { brand } from "@/config/brand";

const toVars = (colors: Record<string, string>) =>
  Object.entries(colors)
    .map(([k, v]) => `--wp-${k}:${v};`)
    .join("");

/**
 * Turns config/brand.ts colours into CSS variables for light + dark.
 * Rendered once in the root layout.
 */
export function BrandStyle() {
  const css = `:root{${toVars(brand.colors.light)}color-scheme:light;}.dark{${toVars(brand.colors.dark)}color-scheme:dark;}`;
  return <style id="wp-brand" dangerouslySetInnerHTML={{ __html: css }} />;
}
