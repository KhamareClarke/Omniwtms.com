"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SignupForm from "./SignupForm";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  // Use state to handle client-side rendering
  const [mounted, setMounted] = useState(false);

  // Only run after component mounts on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until component is mounted on client
  if (!mounted) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[500px] bg-blue-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl text-blue-600 font-bold">
              Get in Touch
            </DialogTitle>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-black hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>
        <div className="mt-4">
          <SignupForm />
        </div>
      </DialogContent>
    </Dialog>
  );
}
