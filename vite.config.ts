import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig(({ command }) => {
	const isDevServer = command === "serve";

	return {
		resolve: {
			alias: {
				"@": fileURLToPath(new URL("./src", import.meta.url)),
			},
		},
		ssr: {
			// Prevent Node.js built-ins from being bundled into client code
			external: [
				"node:stream",
				"node:stream/web",
				"node:fs",
				"node:path",
				"node:async_hooks",
				"node:buffer",
				"node:crypto",
			],
		},
		build: {
			// Lower CPU/RAM pressure on small builders when explicitly enabled.
			minify: "esbuild",
			rollupOptions: {
				// Ensure Node.js modules are not included in client bundle
				external: (id) => {
					// Externalize all node: protocol imports during client builds
					if (id.startsWith("node:")) {
						return true;
					}
					return false;
				},
			},
		},
		plugins: [
			...(isDevServer ? [devtools()] : []),
			nitro(),
			// this is the plugin that enables path aliases
			viteTsConfigPaths({
				projects: ["./tsconfig.json"],
			}),
			tailwindcss(),
			tanstackStart(),
			viteReact(),
		],
	};
});

export default config;
