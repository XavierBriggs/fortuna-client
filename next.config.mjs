/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8082/ws',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081',
    NEXT_PUBLIC_BOT_SERVICE_URL: process.env.NEXT_PUBLIC_BOT_SERVICE_URL || 'http://localhost:8090',
    NEXT_PUBLIC_SLACK_WEBHOOK_URL: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL || '',
  },
};

export default nextConfig;





