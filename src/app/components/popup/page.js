// popup

"use client";

import { useEffect } from "react";

export default function Popup({ isOpen, onClose, children }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0,
        width: "100%", height: "100%",
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
      //onClick={onClose}
    >
      <div
  className="bg-white rounded-lg shadow-xl w-[95vw] max-w-md max-h-[90vh] overflow-y-auto mx-4"
  style={{
    maxWidth: "400px"
  }}
  onClick={(e) => e.stopPropagation()}
>
  <div className="p-4 sm:p-6">
    {children}
  </div>
</div>
    </div>
  );
}
