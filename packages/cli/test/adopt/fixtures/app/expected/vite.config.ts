import stylex from "@stylexjs/unplugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [stylex({ useCSSLayers: false }), react()],
  test: {
    environment: "jsdom",
  },
});
