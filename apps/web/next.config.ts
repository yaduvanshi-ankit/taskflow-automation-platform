import type { NextConfig } from 'next';
// Needed when the dev server is opened through the Docker/WSL network address.
const nextConfig: NextConfig = { output: 'standalone', allowedDevOrigins: ['172.28.194.121'] };
export default nextConfig;
