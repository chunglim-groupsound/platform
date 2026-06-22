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
  // public/ 정적 HTML 파일은 CSS가 인라인으로 포함되어 있어 Next.js 빌드 해시의
  // 적용을 받지 않음. no-cache로 서버에 ETag를 매번 확인하게 해 CSS 변경 시
  // 사용자가 자동으로 최신 버전을 받도록 함.
  headers: async () => [
    {
      source: '/(landing|join|join-existing|join-new).html',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, must-revalidate' },
      ],
    },
  ],
};

export default nextConfig;
