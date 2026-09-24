import type { NextConfig } from "next";

/**
 * Static export → `out/` (upload to public_html on any Hostinger plan).
 * On Hostinger Node.js Web Apps the platform builds in standalone server mode
 * instead — every page here is static either way.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
