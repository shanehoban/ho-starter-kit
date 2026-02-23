import { Link, Text } from "@react-email/components";
import { BaseEmail, buttonStyle, paragraph } from "./_shared";

type UserRegisteredEmailProps = {
	adminName: string;
	userName: string;
	userEmail: string;
	adminUsersUrl: string;
};

export function UserRegisteredEmail({
	adminName,
	userName,
	userEmail,
	adminUsersUrl,
}: UserRegisteredEmailProps) {
	return (
		<BaseEmail preview="New user registration pending approval" title="New user registration">
			<Text style={paragraph}>Hi {adminName},</Text>
			<Text style={paragraph}>A new user has registered and is awaiting approval.</Text>
			<Text style={paragraph}>
				<strong>Name:</strong> {userName}
				<br />
				<strong>Email:</strong> {userEmail}
			</Text>
			<Link href={adminUsersUrl} style={buttonStyle}>
				Review users
			</Link>
		</BaseEmail>
	);
}

export default UserRegisteredEmail;
