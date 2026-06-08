export const feedbackCategories = ["bug", "idea", "question", "other"] as const;

export type FeedbackCategory = (typeof feedbackCategories)[number];

export type FeedbackActionInput = {
	category: FeedbackCategory;
	message: string;
	currentUrl?: string;
	context?: string;
};

export const feedbackCategoryLabels: Record<FeedbackCategory, string> = {
	bug: "Bug",
	idea: "Idea",
	question: "Question",
	other: "Other",
};
