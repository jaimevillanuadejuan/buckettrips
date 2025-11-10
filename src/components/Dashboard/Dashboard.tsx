"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "../../assets/logo/logo.svg";

const Dashboard = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-second text-white">
      {/* __block */}
      <div className="flex flex-col justify-center items-center gap-8">
        {/* __content */}
        <div className="flex flex-col justify-center items-center gap-4 md:flex-row">
          {/* __message */}
          <div className="relative flex justify-center items-center">
            {/* __text */}
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

        <Link href="/new-trip">
          <button className="button">Get Started</button>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
