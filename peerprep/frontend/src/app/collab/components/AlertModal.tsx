"use client";

import React from "react";
import { Wifi, WifiOff, Plug, HandIcon } from "lucide-react";

export type AlertType = "partner-left" | "disconnected" | "reconnected" | "partner-disconnected";

interface AlertModalProps {
  isOpen: boolean;
  type: AlertType;
  onClose: () => void;
  onAction?: () => void;
  onSecondaryAction?: () => void;
}

interface AlertConfig {
  icon: string | React.ReactElement;
  title: string;
  subtitle?: string;
  bgColor: string;
}

const alertConfigs: Record<AlertType, AlertConfig> = {
  "partner-left": {
    icon: <HandIcon className="rotate-45 w-16 h-16 text-text-dark-box" />,
    title: "Your partner has left the room. You may continue working on the code till the session ends or leave as well",
    bgColor: "bg-dark-box",
  },
  "disconnected": {
    icon: <WifiOff className="w-16 h-16 text-red-600" />,
    title: "Disconnected from session. Trying to reconnect...",
    subtitle: "Please double-check your internet connection",
    bgColor: "bg-red-800",
  },
  "reconnected": {
    icon: <Plug className="rotate-45 w-16 h-16 text-green-600" />,
    title: "Connection restored!",
    subtitle: "Please wait while we sync your editor",
    bgColor: "bg-green-800",
  },
  "partner-disconnected": {
    icon: <WifiOff className="w-16 h-16 text-yellow-600" />,
    title: "Your partner has disconnected from the session.",
    subtitle: "We are attempting to reconnect them now...Please continue to work on your own attempt!",
    bgColor: "bg-yellow-800",
  }
};

export default function AlertModal({ 
  isOpen, 
  type, 
  onClose, 
  onAction, 
  onSecondaryAction 
}: AlertModalProps) {
  const config = alertConfigs[type];


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className={`${config.bgColor} rounded-2xl px-6 py-8 max-w-2xl mx-4 relative`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-10">
          <div className="flex-shrink-0">
            {typeof config.icon === "string" ? (
              <span className="text-6xl">{config.icon}</span>
            ) : (
              config.icon
            )}
          </div>
          <div className="text-center">
            <h2 className="text-white/90 font-poppins text-2xl font-bold mb-2">
              {config.title}
            </h2>
            {config.subtitle && (
              <p className="text-white font-poppins opacity-80">
                {config.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}