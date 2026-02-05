import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
  // Note: Do NOT use i18n config here - it's for Pages Router only
  // App Router uses next-intl plugin with middleware instead
};

export default withNextIntl(nextConfig);
