import { buildContentSecurityPolicy, CSP_SCRIPT_NONCE } from "../../lib/csp";

const isProduction = process.env.NODE_ENV === "production";

const baseSecurityHeaders = {
	"X-Frame-Options": "DENY",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
	"Cross-Origin-Opener-Policy": "same-origin",
	"Cross-Origin-Resource-Policy": "same-origin",
};

if (isProduction) {
	baseSecurityHeaders["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
}

export default (nitroApp) => {
	nitroApp.hooks.hook("request", (event) => {
		for (const [headerName, headerValue] of Object.entries(baseSecurityHeaders)) {
			event.node.res.setHeader(headerName, headerValue);
		}

		event.node.res.setHeader(
			"Content-Security-Policy",
			buildContentSecurityPolicy({ isProduction }),
		);
	});

	nitroApp.hooks.hook("render:response", (response, { event }) => {
		const contentType = event.node.res.getHeader("content-type");
		const isHtml = typeof contentType === "string" && contentType.includes("text/html");

		if (isHtml && typeof response.body === "string") {
			response.body = response.body.replace(
				/<script>\s*<\/script>/g,
				`<script nonce="${CSP_SCRIPT_NONCE}"></script>`,
			);
		}
	});
};
