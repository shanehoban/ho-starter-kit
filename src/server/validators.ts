import { z } from "zod";

export const roleSchema = z.enum(["super-admin", "admin", "member"]);

export const trimmedStringSchema = z.string().trim().min(1);

export const optionalTrimmedStringSchema = z
	.string()
	.trim()
	.transform((value) => (value.length > 0 ? value : null))
	.nullable();
