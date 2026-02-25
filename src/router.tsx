import { createRouter } from "@tanstack/react-router";
import { CSP_SCRIPT_NONCE } from "@/lib/csp";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
	const router = createRouter({
		routeTree,
		context: {},
		ssr: {
			nonce: CSP_SCRIPT_NONCE,
		},

		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
	});

	return router;
};
