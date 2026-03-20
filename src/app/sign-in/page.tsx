import { signIn } from '../../auth';
import { FaGithub, FaGoogle } from 'react-icons/fa';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl = '/', error } = await searchParams;

  return (
    <div className="page-center flex flex-col items-center justify-center gap-8 text-white">
      <h1 className="text-4xl font-bold uppercase tracking-widest">Sign In</h1>

      {error && (
        <p className="text-red-400 text-sm">
          Authentication failed. Please try again.
        </p>
      )}

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            className="button w-full flex items-center justify-center gap-3"
          >
            <FaGoogle />
            Continue with Google
          </button>
        </form>

        <form
          action={async () => {
            'use server';
            await signIn('github', { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            className="button w-full flex items-center justify-center gap-3"
          >
            <FaGithub />
            Continue with GitHub
          </button>
        </form>
      </div>
    </div>
  );
}
