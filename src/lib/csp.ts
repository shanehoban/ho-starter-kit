export const CSP_SCRIPT_NONCE = process.env.CSP_SCRIPT_NONCE?.trim() || "ho-starter-kit-csp-nonce";

export function buildContentSecurityPolicy({ isProduction }: { isProduction: boolean }): string {
	const scriptSources = isProduction
		? `'self' 'nonce-${CSP_SCRIPT_NONCE}'`
		: `'self' 'unsafe-inline' 'unsafe-eval' blob:`;
	const connectSources = isProduction ? `'self'` : `'self' ws: wss: http: https:`;

	return `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: blob:; script-src ${scriptSources}; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src ${connectSources}`;
}
