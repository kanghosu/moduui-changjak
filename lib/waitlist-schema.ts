import { z } from "zod";
import { isLang, type Lang } from "./i18n.ts";

const langSchema = z.custom<Lang>((value: unknown) => typeof value === "string" && isLang(value));

export const waitlistPayloadSchema = z.object({
  email: z.string().trim().max(254).email(),
  name: z.string().trim().max(80).optional().default(""),
  message: z.string().trim().max(2000).optional().default(""),
  type: z.enum(["waitlist", "contact"]),
  lang: langSchema,
  website: z.string().trim().optional().default(""),
});
