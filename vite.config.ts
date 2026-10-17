// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  nitro: {
    preset: "vercel",
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    importProtection: {
      client: {
        excludeFiles: ["**/server/functions/**"],
      },
    },
  },
  vite: {
    plugins: [
      {
        name: "better-auth-dev-server",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith("/api/auth")) {
              try {
                const { auth } = await import("./src/server/auth/index");
                const { toNodeHandler } = await import("better-auth/node");
                return toNodeHandler(auth)(req, res);
              } catch (err) {
                console.error("[better-auth dev error]", err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Auth handler failed" }));
                return;
              }
            }
            next();
          });
        },
      },
    ],
  },
});
