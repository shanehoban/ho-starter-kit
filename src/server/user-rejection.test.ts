import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getAuthUser: vi.fn(),
	selectWhere: vi.fn(),
	updateWhere: vi.fn(),
	set: vi.fn(),
	deleteWhere: vi.fn(),
	values: vi.fn(),
	selectRows: [] as Record<string, unknown>[],
	updatedRows: [{ id: "target" }] as Record<string, unknown>[],
}));

vi.mock("@tanstack/react-start", () => ({
	createServerFn: () => {
		let validate = (data: unknown) => data;
		const builder = {
			validator: (fn: typeof validate) => {
				validate = fn;
				return builder;
			},
			handler: (fn: (args: { data: unknown }) => unknown) => (args?: { data: unknown }) =>
				fn({ data: validate(args?.data) }),
		};
		return builder;
	},
}));
vi.mock("@/server/auth-utils", async () => ({
	...(await import("@/server/auth-guards")),
	getAuthUser: mocks.getAuthUser,
}));
vi.mock("@/server/request-security", () => ({ assertSameOriginRequest: vi.fn() }));
vi.mock("@/server/email/notification-emailer", () => ({
	sendUserApprovedEmail: vi.fn(),
	sendPasswordResetEmail: vi.fn(),
	sendUserRegisteredEmailToAdmins: vi.fn(),
}));
vi.mock("@/server/email/rate-limiter", () => ({ checkEmailRateLimit: vi.fn() }));
vi.mock("@/server/email/verification-tokens", () => ({
	createVerificationToken: vi.fn(),
	verifyToken: vi.fn(),
}));
vi.mock("@/server/rate-limiter", () => ({ checkPublicRateLimit: vi.fn() }));
vi.mock("@/server/app-url", () => ({ toAppUrl: vi.fn() }));
vi.mock("@/db", () => ({
	db: {
		select: () => ({ from: () => ({ where: mocks.selectWhere }) }),
		update: () => ({ set: mocks.set }),
		delete: () => ({ where: mocks.deleteWhere }),
		insert: () => ({ values: mocks.values }),
	},
}));

import { sendUserApprovedEmail } from "@/server/email/notification-emailer";
import {
	approveUser,
	getAdminStats,
	getPendingUsers,
	rejectUser,
	updateUser,
} from "@/server/users";

const target = {
	id: "target",
	name: "New user",
	email: "new@example.com",
	role: "member",
	approved: false,
	rejected: false,
	accountType: "moderator",
};
const dialect = new PgDialect();

beforeEach(() => {
	vi.clearAllMocks();
	mocks.getAuthUser.mockResolvedValue({
		id: "super",
		name: "Super admin",
		role: "super-admin",
		approved: true,
	});
	mocks.selectRows = [target];
	mocks.updatedRows = [{ id: "target" }];
	mocks.selectWhere.mockImplementation(() => {
		const rows = Promise.resolve(mocks.selectRows);
		return Object.assign(rows, { orderBy: () => rows });
	});
	mocks.updateWhere.mockImplementation(() =>
		Object.assign(Promise.resolve(), { returning: () => Promise.resolve(mocks.updatedRows) }),
	);
	mocks.set.mockReturnValue({ where: mocks.updateWhere });
	mocks.deleteWhere.mockResolvedValue(undefined);
	mocks.values.mockImplementation(() =>
		Object.assign(Promise.resolve(), { returning: () => Promise.resolve([{ id: 1 }]) }),
	);
});

describe("signup rejection", () => {
	it("records a rejection, keeps access unapproved and revokes sessions without emailing", async () => {
		await expect(rejectUser({ data: { userId: "target" } })).resolves.toEqual({ success: true });
		expect(mocks.set).toHaveBeenCalledWith({
			rejected: true,
			updatedAt: expect.any(Date),
			updatedBy: "super",
		});
		expect(mocks.deleteWhere).toHaveBeenCalledOnce();
		expect(sendUserApprovedEmail).not.toHaveBeenCalled();
		expect(mocks.values).not.toHaveBeenCalled();
		const condition = dialect.sqlToQuery(mocks.updateWhere.mock.calls[0][0]);
		expect(condition.sql).toContain('"users"."approved"');
		expect(condition.params).toEqual(["target", 0, "member"]);
	});

	it.each(["member", "admin"])("prevents a %s from rejecting users", async (role) => {
		mocks.getAuthUser.mockResolvedValue({ id: "other", role, approved: true });
		await expect(rejectUser({ data: { userId: "target" } })).rejects.toThrow();
		expect(mocks.set).not.toHaveBeenCalled();
	});

	it("prevents an unapproved super-admin from rejecting users", async () => {
		mocks.getAuthUser.mockResolvedValue({ id: "super", role: "super-admin", approved: false });
		await expect(rejectUser({ data: { userId: "target" } })).rejects.toThrow();
		expect(mocks.set).not.toHaveBeenCalled();
	});

	it("prevents self rejection", async () => {
		await expect(rejectUser({ data: { userId: "super" } })).rejects.toThrow(
			"Cannot reject yourself",
		);
		expect(mocks.set).not.toHaveBeenCalled();
	});

	it.each([{ approved: true }, { role: "super-admin" }])(
		"protects existing access and super-admin accounts: %j",
		async (changes) => {
			mocks.selectRows = [{ ...target, ...changes }];
			await expect(rejectUser({ data: { userId: "target" } })).rejects.toThrow(
				"Only unapproved users can be rejected",
			);
			expect(mocks.set).not.toHaveBeenCalled();
		},
	);

	it("reports a missing user", async () => {
		mocks.selectRows = [];
		await expect(rejectUser({ data: { userId: "target" } })).rejects.toThrow("User not found");
		expect(mocks.set).not.toHaveBeenCalled();
	});

	it("does not revoke sessions if the user was approved concurrently", async () => {
		mocks.updatedRows = [];
		await expect(rejectUser({ data: { userId: "target" } })).rejects.toThrow("User status changed");
		expect(mocks.deleteWhere).not.toHaveBeenCalled();
	});

	it("allows repeated rejection of a rejected account", async () => {
		mocks.selectRows = [{ ...target, rejected: true }];
		await expect(rejectUser({ data: { userId: "target" } })).resolves.toEqual({ success: true });
	});

	it("lets a super-admin approve a rejected user later", async () => {
		mocks.selectRows = [{ ...target, rejected: true }];
		await approveUser({ data: { userId: "target" } });
		expect(mocks.set).toHaveBeenCalledWith(
			expect.objectContaining({ approved: true, rejected: false }),
		);
		expect(sendUserApprovedEmail).toHaveBeenCalledOnce();
	});

	it("restricts both approval endpoints to super-admins", async () => {
		mocks.getAuthUser.mockResolvedValue({ id: "admin", role: "admin", approved: true });
		await expect(approveUser({ data: { userId: "target" } })).rejects.toThrow();
		await expect(updateUser({ data: { userId: "target", approved: true } })).rejects.toThrow();
		expect(mocks.set).not.toHaveBeenCalled();
	});

	it("preserves rejection when a regular admin edits other user details", async () => {
		mocks.getAuthUser.mockResolvedValue({ id: "admin", role: "admin", approved: true });
		mocks.selectRows = [{ ...target, rejected: true }];
		await updateUser({ data: { userId: "target", role: "member" } });
		const changes = mocks.set.mock.calls[0][0];
		expect(changes).not.toHaveProperty("approved");
		expect(changes).not.toHaveProperty("rejected");
	});

	it("clears rejection when a super-admin approves through user editing", async () => {
		mocks.selectRows = [{ ...target, rejected: true }];
		await updateUser({ data: { userId: "target", approved: true } });
		expect(mocks.set).toHaveBeenCalledWith(
			expect.objectContaining({ approved: true, rejected: false }),
		);
	});

	it("excludes rejected users from the pending queue and pending count", async () => {
		await getPendingUsers();
		await getAdminStats();
		for (const [condition] of mocks.selectWhere.mock.calls) {
			const query = dialect.sqlToQuery(condition);
			expect(query.sql).toContain('"users"."approved"');
			expect(query.sql).toContain('"users"."rejected"');
			expect(query.params.slice(-2)).toEqual([0, 0]);
		}
	});
});
