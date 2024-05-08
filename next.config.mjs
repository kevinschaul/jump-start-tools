const basePath = process.env.GITHUB_PAGES_BASE_PATH || "/";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "dist",
  basePath: basePath,
};

export default nextConfig;
