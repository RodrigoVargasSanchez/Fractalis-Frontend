"use client";

import { useEffect } from "react";

interface ErrorModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function ErrorModal({ isOpen, title, message, onClose }: ErrorModalProps) {
  useEffect(() => {
    if (isOpen) {
      const messageText = `${title}\n${message}`;
      
      if (!confirm(messageText)) {
        onClose();
      } else {
        onClose();
      }
    }
  }, [isOpen, title, message, onClose]);
  return null;
}