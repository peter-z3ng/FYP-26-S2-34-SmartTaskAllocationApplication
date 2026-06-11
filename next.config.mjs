/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabled because @react-three/rapier physics joints (used by the Lanyard
  // component) break on Strict Mode's dev-only double-mount: the rope joints
  // fail to re-attach on remount, so the card free-falls out of view.
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
