const basePath = process.env.GITHUB_PAGES_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "dist",
  basePath: basePath,
  images: { unoptimized: true }
};

export default nextConfig;
