"use client"
import type { NextConfig } from "next";
// @ts-ignore
import MonacoEditorWebpackPlugin from "monaco-editor-webpack-plugin";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins = config.plugins || [];
      config.plugins.push(
        new MonacoEditorWebpackPlugin({
          languages: ["javascript", "typescript", "json", "html", "css"],
        })
      );
    }
    return config;
  },
};

export default nextConfig;
