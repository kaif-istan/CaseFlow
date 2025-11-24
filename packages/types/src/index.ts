
import z from "zod"
export type CaseRow = {

  case_id: string;
  applicant_name: string;
  dob: string;
  email: string;
  phone: string;
  category: "TAX" | "LICENSE" | "PERMIT" | "OTHER";
  priority: "HIGH" | "MEDIUM" | "LOW";
};

export const CaseRowSchema = z.object({
  case_id: z
    .string()
    .min(1, "Required")
    .regex(/^C-\d+$/, "Must be like C-1001"),
  applicant_name: z.string().min(1, "Required"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  email: z.email().or(z.literal("")),
  phone: z
    .string()
    .regex(/^[\d\s+\-\(\)]*$/, "Invalid phone")
    .or(z.literal("")),
  category: z.enum(["TAX", "LICENSE", "PERMIT"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
});