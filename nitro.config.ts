import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
	plugins: ["./src/server/plugins/security-headers.mjs"],
});
