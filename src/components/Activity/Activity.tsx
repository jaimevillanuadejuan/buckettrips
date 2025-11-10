"use client";

import React from "react";

interface ActivityProps {
  title: string;
  description: string;
  imageUrl: string;
}

export default function Activity({
  title,
  description,
  imageUrl,
}: ActivityProps) {
  return (
    <div className="relative bg-white rounded-xl shadow-md hover:shadow-lg overflow-hidden transition-all duration-300 group w-full max-w-sm">
      {/* Image */}
      <div className="w-full h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300" />

      {/* Content */}
      <div className="p-5 flex flex-col justify-between">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
