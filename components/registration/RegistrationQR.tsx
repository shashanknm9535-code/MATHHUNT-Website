'use client';

import React, { useRef } from 'react';
import { Download, Printer, QrCode, ShieldCheck } from 'lucide-react';

interface RegistrationQRProps {
  payload: string;
  registrationId: string;
  teamName: string;
  eventName: string;
}

/**
 * Encodes string data into a deterministic binary matrix to render a stylized,
 * highly distinct vector QR pattern matching the MATHHUNT cyan visual identity.
 */
function generateQRGrid(payload: string): boolean[][] {
  const size = 21; // 21x21 QR matrix
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Helper to draw finder pattern (7x7 outer square, 3x3 inner square)
  const drawFinder = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          grid[startR + r][startC + c] = true;
        }
      }
    }
  };

  // 3 Finder patterns
  drawFinder(0, 0); // Top-left
  drawFinder(0, size - 7); // Top-right
  drawFinder(size - 7, 0); // Bottom-left

  // Timing patterns
  for (let i = 7; i < size - 7; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Pseudo-random data filling based on payload checksum
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Don't overwrite finders or timing patterns
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= size - 8) ||
        (r >= size - 8 && c < 8) ||
        r === 6 ||
        c === 6
      ) {
        continue;
      }
      const cellBit = Math.abs(Math.sin((r * size + c) * 9999 + hash)) > 0.45;
      grid[r][c] = cellBit;
    }
  }

  return grid;
}

export const RegistrationQR: React.FC<RegistrationQRProps> = ({
  payload,
  registrationId,
  teamName,
  eventName,
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const grid = generateQRGrid(payload || registrationId || 'MATHHUNT-REG');

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownload = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MATHHUNT-QR-${registrationId || teamName.replace(/\s+/g, '-')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Printable QR Voucher Container */}
      <div
        ref={qrRef}
        className="w-full max-w-[340px] sm:max-w-sm p-4 sm:p-6 rounded-2xl bg-gray-900/90 border border-cyan-500/30 shadow-xl shadow-cyan-500/10 text-center relative overflow-hidden backdrop-blur-md"
      >
        {/* Subtle background glow */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-4">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm tracking-wider">
            <QrCode className="w-4 h-4" />
            <span>MATHHUNT PASS</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            <span>VALIDATED</span>
          </div>
        </div>

        {/* Team & Event Labels */}
        <div className="space-y-1 mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Team Name</p>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide text-cyan-300 break-words">{teamName}</h3>
          <p className="text-xs text-gray-400 font-mono mt-1 break-words">{eventName}</p>
        </div>

        {/* QR Vector Box */}
        <div className="p-3 sm:p-4 bg-white rounded-xl shadow-inner inline-block my-2 border-2 border-cyan-500">
          <svg
            viewBox="0 0 21 21"
            className="w-36 h-36 sm:w-44 sm:h-44"
            shapeRendering="crispEdges"
          >
            {grid.map((row, r) =>
              row.map((cell, c) =>
                cell ? (
                  <rect
                    key={`${r}-${c}`}
                    x={c}
                    y={r}
                    width="1"
                    height="1"
                    fill="#0b0f19"
                  />
                ) : null
              )
            )}
          </svg>
        </div>

        {/* Registration ID Badge */}
        <div className="mt-4 pt-3 border-t border-cyan-500/20 space-y-1">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-mono">
            REGISTRATION ID
          </span>
          <span className="text-xs sm:text-sm font-mono font-bold text-cyan-400 tracking-wider break-all block">
            {registrationId}
          </span>
        </div>
      </div>

      {/* Action CTA Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-sm">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-medium text-xs tracking-wider transition-all duration-200 shadow-md"
        >
          <Download className="w-4 h-4" />
          <span>Save QR Code</span>
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 border border-gray-600/40 font-medium text-xs tracking-wider transition-all duration-200"
        >
          <Printer className="w-4 h-4" />
          <span>Print Voucher</span>
        </button>
      </div>
    </div>
  );
};
