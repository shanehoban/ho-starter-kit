import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

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
				external: [/^node:/u],
			},
		},
		plugins: [
			...(isDevServer ? [devtools()] : []),
			nitro(),
			tailwindcss(),
			tanstackStart(),
			viteReact(),
		],
	};
});

export default config;
