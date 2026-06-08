import { Text } from "@react-email/components";
import { BaseEmail, paragraph } from "./_shared";

type FeedbackEmailProps = {
	appName: string;
	categoryLabel: string;
	message: string;
	context?: string;
	userName: string;
	userEmail: string;
	userId: string;
	currentUrl?: string;
	appUrl: string;
	userAgent: string;
};

export function FeedbackEmail({
	appName,
	categoryLabel,
	message,
	context,
	userName,
	userEmail,
	userId,
	currentUrl,
	appUrl,
	userAgent,
}: FeedbackEmailProps) {
	return (
		<BaseEmail
			preview={`New ${categoryLabel.toLowerCase()} feedback for ${appName}`}
			title={`${appName} feedback`}
		>
			<Text style={paragraph}>
				<strong>Category:</strong> {categoryLabel}
			</Text>
			<Text style={paragraph}>
				<strong>From:</strong> {userName} ({userEmail})
			</Text>
			<Text style={sectionLabel}>Message</Text>
			<Text style={blockText}>{message}</Text>
			{context ? (
				<>
					<Text style={sectionLabel}>Context</Text>
					<Text style={blockText}>{context}</Text>
				</>
			) : null}
			<Text style={sectionLabel}>Request details</Text>
			<Text style={smallText}>
				<strong>User ID:</strong> {userId}
			</Text>
			<Text style={smallText}>
				<strong>App URL:</strong> {appUrl}
			</Text>
			{currentUrl ? (
				<Text style={smallText}>
					<strong>Current URL:</strong> {currentUrl}
				</Text>
			) : null}
			<Text style={smallText}>
				<strong>User agent:</strong> {userAgent}
			</Text>
		</BaseEmail>
	);
}

const sectionLabel = {
	margin: "20px 0 8px",
	fontSize: "13px",
	fontWeight: "700",
	lineHeight: "1.5",
	color: "#111827",
};

const blockText = {
	margin: "0 0 12px",
	padding: "12px",
	borderRadius: "8px",
	backgroundColor: "#f9fafb",
	border: "1px solid #e5e7eb",
	whiteSpace: "pre-wrap" as const,
	fontSize: "14px",
	lineHeight: "1.6",
	color: "#111827",
};

const smallText = {
	margin: "0 0 8px",
	fontSize: "12px",
	lineHeight: "1.5",
	color: "#374151",
};

export default FeedbackEmail;
