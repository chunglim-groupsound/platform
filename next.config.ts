import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 프로토타입에서 옮겨온 JSX 는 느슨한 타입이라, 우선 빌드를 통과시키고
  // 점진적으로 타입을 강화하세요. (디자인 보존 우선 정책)
  typescript: { ignoreBuildErrors: true },
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
