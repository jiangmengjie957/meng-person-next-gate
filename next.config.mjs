/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ["lf3-cdn-tos.bytescm.com"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=30, stale-while-revalidate",
          },
          {
            key: 'x-my-header',
            value: 'my-value',
          }
        ],
      },
    ];
  },
};

export default nextConfig;
