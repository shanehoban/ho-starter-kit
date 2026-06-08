import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FeedbackForm } from "@/components/feedback-dialog";

describe("FeedbackForm", () => {
	it("renders feedback fields and submit button", () => {
		const html = renderToStaticMarkup(
			<FeedbackForm
				category="bug"
				message="Something broke"
				context=""
				status={null}
				sending={false}
				onCategoryChange={vi.fn()}
				onMessageChange={vi.fn()}
				onContextChange={vi.fn()}
				onSubmit={vi.fn()}
			/>,
		);

		expect(html).toContain("Category");
		expect(html).toContain("Message");
		expect(html).toContain("Context");
		expect(html).toContain("Send feedback");
	});

	it("shows disabled sending state", () => {
		const html = renderToStaticMarkup(
			<FeedbackForm
				category="bug"
				message="Something broke"
				context=""
				status={{ tone: "success", text: "Feedback sent. Thank you." }}
				sending={true}
				onCategoryChange={vi.fn()}
				onMessageChange={vi.fn()}
				onContextChange={vi.fn()}
				onSubmit={vi.fn()}
			/>,
		);

		expect(html).toContain("Feedback sent. Thank you.");
		expect(html).toContain("disabled");
		expect(html).toContain("Sending");
	});
});
