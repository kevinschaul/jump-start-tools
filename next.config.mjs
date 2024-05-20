const basePath = process.env.GITHUB_PAGES_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "dist",
  basePath: basePath,
  images: { unoptimized: true },
};

process.env.NEXT_JS_BASE_PATH = basePath;

export default nextConfig;
