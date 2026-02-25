import { defineNitroConfig } from "nitro/config";
import { buildContentSecurityPolicy } from "./src/lib/csp";

const isProduction = process.env.NODE_ENV === "production";

const baseSecurityHeaders: Record<string, string> = {
	"X-Frame-Options": "DENY",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
	"Cross-Origin-Opener-Policy": "same-origin",
	"Cross-Origin-Resource-Policy": "same-origin",
	"Content-Security-Policy": buildContentSecurityPolicy({ isProduction }),
};

if (isProduction) {
	baseSecurityHeaders["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
}

export default defineNitroConfig({
	routeRules: {
		"/**": {
			headers: baseSecurityHeaders,
		},
	},
});
