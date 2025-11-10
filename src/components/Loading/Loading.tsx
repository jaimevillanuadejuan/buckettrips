"use client";

import React from "react";
import { motion } from "framer-motion";

interface LoadingProps {
  location: string;
  response: any;
}

export default function Loading({ location, response }: LoadingProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen bg-background-second text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Spinning Loader */}
      <motion.div
        className="h-20 w-20 rounded-full border-4 border-t-4 border-background-first border-t-background-third animate-spin mb-8 shadow-lg shadow-background-first/30"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
      ></motion.div>

      {/* Text */}
      <motion.p
        className="text-xl font-semibold text-white"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        Preparing your trip to{" "}
        <span className="text-background-first font-bold">{location}</span>...
      </motion.p>

      {/* Optional response display */}
      {response && (
        <motion.p
          className="text-sm text-gray-300 mt-4 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          {JSON.stringify(response, null, 2)}
        </motion.p>
      )}
    </motion.div>
  );
}
