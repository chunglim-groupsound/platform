import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // 카카오 프로필 이미지
      { protocol: 'https', hostname: '*.kakaocdn.net' },
      { protocol: 'http',  hostname: '*.kakaocdn.net' },
      { protocol: 'https', hostname: 'k.kakaocdn.net' },
    ],
  },
};

export default nextConfig;
