import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign In | Viora",
  description: "Sign in to Viora",
};

export default async function SignIn() {
  const session = await getServerSession(authOptions);
  if (session) {
    // If logged in but no org, go to setup to avoid loop
    // @ts-expect-error custom
    const orgId = session.organizationId as string | undefined;
    redirect(orgId ? "/" : "/setup-org");
  }
  return <SignInForm />;
}
