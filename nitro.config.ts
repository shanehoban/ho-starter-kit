import { defineNitroConfig } from "nitro/config";

const themeBootScriptHash = "sha256-/Smwf77htGJwF87aGc1D0SeMzNvJV05oUcLsH3l/BoI=";
const isProduction = process.env.NODE_ENV === "production";
const scriptSources = isProduction
	? `'self' '${themeBootScriptHash}'`
	: `'self' 'unsafe-inline' 'unsafe-eval' blob:`;
const connectSources = isProduction ? `'self'` : `'self' ws: wss: http: https:`;

const baseSecurityHeaders: Record<string, string> = {
	"X-Frame-Options": "DENY",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
	"Cross-Origin-Opener-Policy": "same-origin",
	"Cross-Origin-Resource-Policy": "same-origin",
	"Content-Security-Policy":
		`default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: blob:; script-src ${scriptSources}; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src ${connectSources}`,
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
