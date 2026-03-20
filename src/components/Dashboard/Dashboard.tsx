"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import logo from "../../assets/logo/logo.svg";

const Dashboard = () => {
  const { data: session } = useSession();

  return (
    <div className="page-center flex flex-col text-white">
      <div className="flex flex-col justify-center items-center gap-8">
        <div className="flex flex-col justify-center items-center gap-4 md:flex-row">
          <div className="relative flex justify-center items-center">
            <div className="text-5xl font-bold flex space-x-1">
              {"WELCOME".split("").map((char, i) => (
                <span
                  key={i}
                  style={{ animationDelay: `${i * 0.2}s` }}
                  className="inline-block uppercase animate-flip"
                >
                  {char}
                </span>
              ))}
            </div>
          </div>

          <div className="text-5xl font-bold flex space-x-1 mt-2">
            {"TO".split("").map((char, i) => (
              <span
                key={i}
                style={{ animationDelay: `${i * 0.2}s` }}
                className="inline-block uppercase animate-flip"
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        <Image
          src={logo}
          alt="Logo"
          width={200}
          height={200}
          className="mt-6"
          priority
        />

        {session?.user && (
          <div className="flex flex-col items-center gap-2">
            {session.user.image && (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "avatar"}
                width={56}
                height={56}
                className="rounded-full"
              />
            )}
            <p className="text-lg font-semibold">{session.user.name}</p>
          </div>
        )}

        <Link href={session ? "/new-trip" : "/sign-in"}>
          <button className="button">Get Started</button>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
