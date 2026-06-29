import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // @blocknote/server-util(및 의존하는 @blocknote/core)는 webpack RSC 서버 번들에서
  // 평가되면 `createContext only works in Client Components` 로 throw 한다.
  // externals 로 빼서 Node 런타임에서 require 하게 하면 RSC 가드를 피한다.
  serverExternalPackages: ["@blocknote/server-util", "@blocknote/core"],
};

export default nextConfig;
