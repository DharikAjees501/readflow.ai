"use client";

import React from "react";
import { Sparkles, UploadCloud, Trash2, FileText } from "lucide-react";
import { DocumentMetadata } from "@/lib/types";

interface NavbarProps {
  metadata?: DocumentMetadata | null;
  detectedDomain?: string | null;
  onOpenUpload: () => void;
  onDeleteDocument: () => void;
  isDeleting?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  metadata,
  detectedDomain,
  onOpenUpload,
  onDeleteDocument,
  isDeleting,
}) => {
  return (
    <header className="shrink-0 sticky top-0 z-30 w-full px-4 sm:px-8 py-3 bg-[#FCE2DB]/90 backdrop-blur-md border-b border-[#E4A3D4]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#C295D8] border-2 border-[#E4A3D4] flex items-center justify-center text-white shadow-[0_3px_0_#9E6CB7] animate-float shrink-0">
            <Sparkles className="w-5 h-5 text-yellow-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-[#3D2347]">
                ReadFlow<span className="text-[#C295D8]">.ai</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F1C6D3] text-[#6E497A] border border-[#E4A3D4]">
                Multi-Domain
              </span>
            </div>
            <p className="text-xs text-[#6E497A] font-medium hidden sm:block">
              Interactive Academic &amp; Technical Learning
            </p>
          </div>
        </div>

        {/* Center: Active Document Badge or Clean Domain Indicators */}
        {metadata ? (
          <div className="flex items-center gap-2 bg-[#FFFFFF]/85 border-2 border-[#E4A3D4] px-4 py-1.5 rounded-full shadow-sm text-xs font-semibold text-[#3D2347] max-w-md truncate">
            <FileText className="w-4 h-4 text-[#C295D8] shrink-0" />
            <span className="truncate max-w-[160px] sm:max-w-[220px]" title={metadata.filename}>
              {metadata.filename}
            </span>
            <span className="text-[#9469A3]">•</span>
            <span className="text-[#6E497A] shrink-0">{metadata.total_pages} {metadata.total_pages === 1 ? "page" : "pages"}</span>
            {detectedDomain && (
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-[#F1C6D3] text-[#3D2347] border border-[#E4A3D4] text-[11px] font-bold shrink-0">
                {detectedDomain}
              </span>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-6 text-xs font-semibold text-[#7E5788]">
            <span className="hover:text-[#3D2347] transition cursor-default">Medicine</span>
            <span className="text-[#E4A3D4]">•</span>
            <span className="hover:text-[#3D2347] transition cursor-default">Engineering</span>
            <span className="text-[#E4A3D4]">•</span>
            <span className="hover:text-[#3D2347] transition cursor-default">Software Architecture</span>
            <span className="text-[#E4A3D4]">•</span>
            <span className="hover:text-[#3D2347] transition cursor-default">Mathematics</span>
          </div>
        )}

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="pastel-btn px-4 sm:px-5 py-2 text-xs rounded-full flex items-center gap-2 shadow-[0_3px_0_#9E6CB7]"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload PDF</span>
          </button>

          {/* Dynamic Delete Active PDF Button */}
          {metadata && (
            <button
              onClick={onDeleteDocument}
              disabled={isDeleting}
              className="px-3.5 py-2 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 border-2 border-rose-300 text-xs font-bold transition flex items-center gap-1.5 shadow-[0_2px_0_#FCA5A5] active:translate-y-0.5"
              title="Delete Active Document"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
