import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const password = "StarterKit!123";

function uniqueEmail(prefix: string): string {
	const random = Math.random().toString(36).slice(2, 8);
	return `${prefix}-${Date.now()}-${random}@example.com`;
}

async function registerUser(page: Page, name: string, email: string) {
	const response = await page.context().request.post("/api/auth/sign-up/email", {
		data: {
			name,
			email,
			password,
		},
	});
	if (!response.ok()) {
		throw new Error(`Registration request failed (${response.status()}): ${await response.text()}`);
	}
	await page.goto("/awaiting-approval");
}

async function approveUserInDatabase(email: string) {
	const provider = (process.env.DB_PROVIDER ?? "sqlite").toLowerCase();
	if (provider === "postgres") {
		const databaseUrl = process.env.DATABASE_URL;
		if (!databaseUrl) {
			throw new Error("DATABASE_URL is required for postgres E2E approval helper.");
		}
		const postgres = (await import("postgres")).default;
		const sql = postgres(databaseUrl, { max: 1, connect_timeout: 5 });
		try {
			await sql`update "users" set "approved" = true where "email" = ${email}`;
		} finally {
			await sql.end({ timeout: 0 });
		}
		return;
	}

	const dbPath = process.env.DB_PATH ?? "./sqlite.db";
	const Database = (await import("better-sqlite3")).default;
	const db = new Database(dbPath);
	try {
		db.prepare('update "users" set "approved" = 1 where "email" = ?').run(email);
	} finally {
		db.close();
	}
}

test("enforces protected-route and approval flow", async ({ browser, page }) => {
	const anonymous = await browser.newContext();
	const anonymousPage = await anonymous.newPage();
	await anonymousPage.goto("/app");
	await expect(anonymousPage).toHaveURL(/\/login$/);

	await anonymousPage.goto("/awaiting-approval");
	await expect(anonymousPage).toHaveURL(/\/$/);
	await anonymous.close();

	const adminEmail = uniqueEmail("admin");
	const memberEmail = uniqueEmail("member");

	await registerUser(page, "Audit Admin", adminEmail);
	await expect(page).toHaveURL(/\/app$/);
	await expect(page.getByText("Current role:").first()).toContainText("super-admin");

	await page.goto("/admin");
	await expect(page).toHaveURL(/\/admin\/users$/);

	const memberContext = await browser.newContext();
	const memberPage = await memberContext.newPage();
	await registerUser(memberPage, "Audit Member", memberEmail);
	await expect(memberPage).toHaveURL(/\/awaiting-approval$/);

	await memberPage.goto("/app");
	await expect(memberPage).toHaveURL(/\/awaiting-approval$/);

	await memberPage.goto("/admin/users");
	await expect(memberPage).toHaveURL(/\/awaiting-approval$/);

	await page.goto("/admin/users");
	const pendingCard = page.locator("div.rounded-md.border").filter({ hasText: memberEmail }).first();
	await expect(pendingCard).toBeVisible();
	await approveUserInDatabase(memberEmail);
	await page.reload();

	await memberPage.goto("/awaiting-approval");
	await expect(memberPage).toHaveURL(/\/app$/);

	await memberPage.goto("/admin");
	await expect(memberPage).toHaveURL(/\/app$/);
	await memberContext.close();
});
