import React from "react";
//import clsx from "clsx";

interface CarDiagramProps {
  onSelect: (part: string) => void;
}

export default function InteractiveCarDiagram({ onSelect }: CarDiagramProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <svg
        viewBox="0 0 300 600"
        className="w-full h-auto mx-auto select-none"
        style={{ cursor: "pointer" }}
      >
        {/* --- CAR OUTLINE --- */}
        <rect
          x="50"
          y="20"
          width="200"
          height="560"
          rx="20"
          ry="20"
          fill="#e5e7eb"
          stroke="#4b5563"
          strokeWidth="3"
        />

        {/* ===== CLICKABLE REGIONS ===== */}

        {/* ENGINE */}
        <rect
          x="80"
          y="40"
          width="140"
          height="80"
          fill="#cbd5e1"
          className="hover:fill-blue-300 transition"
          onClick={() => onSelect("engine")}
        />

        {/* TRANSMISSION */}
        <rect
          x="80"
          y="130"
          width="140"
          height="70"
          fill="#cbd5e1"
          className="hover:fill-blue-300 transition"
          onClick={() => onSelect("transmission")}
        />

        {/* FRONT BRAKES */}
        <circle
          cx="75"
          cy="140"
          r="25"
          fill="#d1d5db"
          className="hover:fill-red-300 transition"
          onClick={() => onSelect("front-left-brake")}
        />
        <circle
          cx="225"
          cy="140"
          r="25"
          fill="#d1d5db"
          className="hover:fill-red-300 transition"
          onClick={() => onSelect("front-right-brake")}
        />

        {/* REAR BRAKES */}
        <circle
          cx="75"
          cy="460"
          r="25"
          fill="#d1d5db"
          className="hover:fill-red-300 transition"
          onClick={() => onSelect("rear-left-brake")}
        />
        <circle
          cx="225"
          cy="460"
          r="25"
          fill="#d1d5db"
          className="hover:fill-red-300 transition"
          onClick={() => onSelect("rear-right-brake")}
        />

        {/* TIRES */}
        <circle
          cx="75"
          cy="200"
          r="30"
          fill="#9ca3af"
          className="hover:fill-gray-400 transition"
          onClick={() => onSelect("front-left-tire")}
        />
        <circle
          cx="225"
          cy="200"
          r="30"
          fill="#9ca3af"
          className="hover:fill-gray-400 transition"
          onClick={() => onSelect("front-right-tire")}
        />
        <circle
          cx="75"
          cy="400"
          r="30"
          fill="#9ca3af"
          className="hover:fill-gray-400 transition"
          onClick={() => onSelect("rear-left-tire")}
        />
        <circle
          cx="225"
          cy="400"
          r="30"
          fill="#9ca3af"
          className="hover:fill-gray-400 transition"
          onClick={() => onSelect("rear-right-tire")}
        />

        {/* BATTERY */}
        <rect
          x="120"
          y="260"
          width="60"
          height="40"
          fill="#fef9c3"
          className="hover:fill-yellow-300 transition"
          onClick={() => onSelect("battery")}
        />

        {/* SUSPENSION */}
        <rect
          x="80"
          y="330"
          width="140"
          height="60"
          fill="#cbd5e1"
          className="hover:fill-green-300 transition"
          onClick={() => onSelect("suspension")}
        />

        {/* STEERING */}
        <rect
          x="110"
          y="500"
          width="80"
          height="50"
          fill="#cbd5e1"
          className="hover:fill-purple-300 transition"
          onClick={() => onSelect("steering")}
        />
      </svg>

      {/* LABELS BELOW FOR ACCESSIBILITY & MOBILE */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <button
          onClick={() => onSelect("engine")}
          className="py-2 px-3 bg-gray-200 rounded hover:bg-gray-300"
        >
          Engine
        </button>
        <button
          onClick={() => onSelect("transmission")}
          className="py-2 px-3 bg-gray-200 rounded hover:bg-gray-300"
        >
          Transmission
        </button>
        <button
          onClick={() => onSelect("battery")}
          className="py-2 px-3 bg-gray-200 rounded hover:bg-gray-300"
        >
          Battery
        </button>
        <button
          onClick={() => onSelect("suspension")}
          className="py-2 px-3 bg-gray-200 rounded hover:bg-gray-300"
        >
          Suspension
        </button>
        <button
          onClick={() => onSelect("steering")}
          className="py-2 px-3 bg-gray-200 rounded hover:bg-gray-300"
        >
          Steering
        </button>
        <button
          onClick={() => onSelect("tires-all")}
          className="py-2 px-3 bg-gray-200 rounded hover:bg-gray-300"
        >
          Tires
        </button>
      </div>
    </div>
  );
}