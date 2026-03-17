"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "../../assets/logo/logo.svg";

export default function Header() {
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
      <nav className="flex items-center gap-2">
        <Link
          href="/my-trips"
          className="text-white text-sm font-semibold uppercase tracking-[2px] transition-opacity hover:opacity-85"
        >
          My Trips
        </Link>
      </nav>
    </header>
  );
}
