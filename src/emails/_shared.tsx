import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components";

type BaseEmailProps = {
	preview: string;
	title: string;
	children: React.ReactNode;
};

export function BaseEmail({ preview, title, children }: BaseEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>{preview}</Preview>
			<Body style={body}>
				<Container style={container}>
					<Heading as="h1" style={heading}>
						{title}
					</Heading>
					<Section>{children}</Section>
					<Hr style={hr} />
					<Text style={footer}>ho-starter-kit</Text>
				</Container>
			</Body>
		</Html>
	);
}

export const paragraph = {
	margin: "0 0 16px",
	fontSize: "14px",
	lineHeight: "1.6",
	color: "#111827",
};

export const buttonStyle = {
	display: "inline-block",
	padding: "10px 16px",
	borderRadius: "8px",
	backgroundColor: "#111827",
	color: "#ffffff",
	textDecoration: "none",
	fontWeight: "600",
	fontSize: "14px",
};

const body = {
	backgroundColor: "#f3f4f6",
	margin: "0",
	padding: "24px 0",
	fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
	backgroundColor: "#ffffff",
	borderRadius: "12px",
	padding: "24px",
	maxWidth: "560px",
};

const heading = {
	margin: "0 0 20px",
	fontSize: "20px",
	lineHeight: "1.3",
	color: "#111827",
};

const hr = {
	margin: "24px 0 12px",
	borderColor: "#e5e7eb",
};

const footer = {
	margin: "0",
	fontSize: "12px",
	lineHeight: "1.5",
	color: "#6b7280",
};
