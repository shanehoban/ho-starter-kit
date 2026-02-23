import { describe, expect, it } from "vitest";
import { isAdmin, requireAdmin, requireSuperAdmin } from "@/server/auth-guards";

describe("auth-guards", () => {
	it("requireAdmin allows approved admins", () => {
		expect(() => requireAdmin({ role: "admin", approved: true })).not.toThrow();
		expect(() => requireAdmin({ role: "super-admin", approved: true })).not.toThrow();
	});

	it("requireAdmin rejects unapproved admins", () => {
		expect(() => requireAdmin({ role: "admin", approved: false })).toThrow("Account not approved");
	});

	it("requireSuperAdmin rejects non-super-admin roles", () => {
		expect(() => requireSuperAdmin({ role: "admin", approved: true })).toThrow(
			"Super-admin access required",
		);
	});

	it("requireSuperAdmin rejects unapproved super-admins", () => {
		expect(() => requireSuperAdmin({ role: "super-admin", approved: false })).toThrow(
			"Account not approved",
		);
	});

	it("isAdmin requires both admin role and approved status", () => {
		expect(isAdmin({ role: "admin", approved: true })).toBe(true);
		expect(isAdmin({ role: "super-admin", approved: true })).toBe(true);
		expect(isAdmin({ role: "admin", approved: false })).toBe(false);
		expect(isAdmin({ role: "member", approved: true })).toBe(false);
	});
});
