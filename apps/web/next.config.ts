import type { NextConfig } from "next";
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["@prisma/client", "bcrypt-ts", "pg"],
};

export default nextConfig;
