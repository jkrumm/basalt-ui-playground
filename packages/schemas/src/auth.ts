import { z } from "zod";

export const SignInSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const SignUpSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  password: z.string().min(8).max(128),
});

export type SignIn = z.infer<typeof SignInSchema>;
export type SignUp = z.infer<typeof SignUpSchema>;
