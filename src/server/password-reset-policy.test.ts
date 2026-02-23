import { describe, expect, it } from "vitest";
import { canAdminSendResetLink } from "@/server/password-reset-policy";

describe("canAdminSendResetLink", () => {
	it("allows admin to send reset link to member/admin targets", () => {
		expect(canAdminSendResetLink({ adminRole: "admin", targetRole: "member" })).toBe(true);
		expect(canAdminSendResetLink({ adminRole: "admin", targetRole: "admin" })).toBe(true);
	});

	it("blocks admin from sending reset link to super-admin target", () => {
		expect(canAdminSendResetLink({ adminRole: "admin", targetRole: "super-admin" })).toBe(false);
	});

	it("allows super-admin to send reset links to all roles", () => {
		expect(canAdminSendResetLink({ adminRole: "super-admin", targetRole: "member" })).toBe(true);
		expect(canAdminSendResetLink({ adminRole: "super-admin", targetRole: "admin" })).toBe(true);
		expect(canAdminSendResetLink({ adminRole: "super-admin", targetRole: "super-admin" })).toBe(
			true,
		);
	});
});
