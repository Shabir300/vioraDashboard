import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function SetupOrgPage() {
  const session = await getServerSession(authOptions);
  return (
    <div className="max-w-lg mx-auto mt-24 rounded-2xl border border-gray-200 p-6 text-center dark:border-gray-800 dark:bg-white/[0.03]">
      <h1 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white/90">Set up your workspace</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {session ? "You're signed in but not linked to any organization yet." : "Please sign in first."}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/signin" className="rounded-lg bg-gray-100 px-4 py-2 text-sm dark:bg-white/10">Sign in</Link>
        <Link href="/" className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white">Back Home</Link>
      </div>
    </div>
  );
}


