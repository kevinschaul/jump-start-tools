/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "dist",
  basePath: "/jump-start",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/jump-start",
        basePath: false,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
