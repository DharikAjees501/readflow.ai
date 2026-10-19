"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  UploadCloud,
  FileCheck,
  Sparkles,
} from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFile: (file: File) => Promise<void>;
  isUploading: boolean;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadFile,
  isUploading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(15);
  const [uploadStageText, setUploadStageText] = useState("Reading PDF stream...");
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    let timer3: NodeJS.Timeout;

    if (isUploading) {
      setUploadProgress(20);
      setUploadStageText("Reading PDF byte streams & metadata...");

      timer1 = setTimeout(() => {
        setUploadProgress(55);
        setUploadStageText("PyMuPDF extracting pages & rendering vector views...");
      }, 350);

      timer2 = setTimeout(() => {
        setUploadProgress(85);
        setUploadStageText("Normalizing font encodings & character glyphs...");
      }, 800);

      timer3 = setTimeout(() => {
        setUploadProgress(95);
        setUploadStageText("Underlining clinical terms & launching Scanslated view...");
      }, 1300);
    } else {
      setUploadProgress(15);
      setUploadStageText("Reading PDF stream...");
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isUploading]);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    await onUploadFile(selectedFile);
    setSelectedFile(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-xl bg-[#FCE2DB] border-4 border-[#E4A3D4] rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(228,163,212,0.45)] max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-2xl bg-white/80 border-2 border-[#E4A3D4] text-[#6E497A] hover:bg-[#F1C6D3] transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1C6D3] border border-[#E4A3D4] text-xs font-bold text-[#6E497A] mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C295D8]" />
              <span>Multi-Domain PDF Ingestion</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#3D2347]">
              Upload Your PDF
            </h2>
            <p className="text-sm text-[#6E497A] mt-1 max-w-md mx-auto">
              Select or drop any PDF to extract critical concepts, domain taxonomy, and interactive highlights.
            </p>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-3 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-[#C295D8] bg-[#F1C6D3]/60 scale-[1.01]"
                : "border-[#E4A3D4] bg-white/70 hover:bg-white/90"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[#F1C6D3] border-2 border-[#E4A3D4] flex items-center justify-center text-[#C295D8] shadow-[0_3px_0_#E4A3D4]">
              {selectedFile ? (
                <FileCheck className="w-8 h-8 text-emerald-600" />
              ) : (
                <UploadCloud className="w-8 h-8 text-[#C295D8]" />
              )}
            </div>

            {selectedFile ? (
              <div>
                <p className="font-bold text-[#3D2347] text-base">{selectedFile.name}</p>
                <p className="text-xs text-[#6E497A] mt-1">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                </p>
                {isUploading ? (
                  <div className="mt-5 w-full bg-white/95 border-2 border-[#E4A3D4] rounded-2xl p-4 shadow-sm text-left">
                    <div className="flex items-center justify-between text-xs font-bold text-[#6E497A] mb-2">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#C295D8] animate-spin" />
                        <span>{uploadStageText}</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#C295D8] text-white text-[11px] font-black shadow-sm">
                        {uploadProgress}%
                      </span>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="w-full bg-[#FCE2DB] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#E4A3D4]">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#C295D8] via-[#E4A3D4] to-[#0D9488]"
                        initial={{ width: "15%" }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                      />
                    </div>

                    <p className="text-[11px] text-[#9469A3] mt-2 italic text-center">
                      Fast-pass active • Normalizing font vectors &amp; underlining clinical terminology...
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirmUpload();
                    }}
                    className="mt-4 pastel-btn px-6 py-2.5 text-sm inline-flex items-center gap-2"
                  >
                    Submit &amp; Start Learning
                  </button>
                )}
              </div>
            ) : (
              <div>
                <p className="font-bold text-[#3D2347] text-base">
                  Drag &amp; drop any PDF here, or <span className="text-[#C295D8] underline">browse files</span>
                </p>
                <p className="text-xs text-[#6E497A] mt-1">
                  Supports Medical, Education, Industrial, Finance, Mathematics &amp; Research papers.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
