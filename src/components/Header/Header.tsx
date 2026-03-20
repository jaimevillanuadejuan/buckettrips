"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import logo from "../../assets/logo/logo.svg";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="w-full flex items-center justify-between gap-4 p-6 bg-background-first">
      <Link href="/" className="inline-flex items-center">
        <Image
          src={logo}
          alt="BucketTrips Logo"
          width={120}
          height={40}
          className="logo-header w-48 h-auto transition-transform duration-300 hover:scale-105"
        />
      </Link>
      <nav className="flex items-center gap-4">
        {session ? (
          <>
            <Link
              href="/my-trips"
              className="text-white text-sm font-semibold uppercase tracking-[2px] transition-colors duration-200 hover:[color:#0c2d48]"
            >
              My Trips
            </Link>
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "avatar"}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="bg-transparent border-none text-white text-sm font-semibold uppercase tracking-[2px] transition-colors duration-200 cursor-pointer hover:[color:#0c2d48]"
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link
            href="/sign-in"
            className="text-white text-sm font-semibold uppercase tracking-[2px] transition-colors duration-200 hover:[color:#0c2d48]"
          >
            Sign In
          </Link>
        )}
      </nav>
    </header>
  );
}
