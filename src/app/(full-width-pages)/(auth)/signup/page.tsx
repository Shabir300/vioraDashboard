import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign Up | Viora",
  description: "Create your Viora account",
};

export default async function SignUp() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/");
  return <SignUpForm />;
}
