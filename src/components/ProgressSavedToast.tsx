import { useEffect, useState } from "react";
import { Check } from "lucide-react";

interface ProgressSavedToastProps {
  show: boolean;
  onDone: () => void;
}

const ProgressSavedToast = ({ show, onDone }: ProgressSavedToastProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(onDone, 300);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);

  if (!show && !visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
        background: "#333",
        color: "#fff",
        padding: "8px 16px",
        borderRadius: 8,
        fontSize: 13,
        fontFamily: "'Roboto', sans-serif",
        display: "flex",
        alignItems: "center",
        gap: 6,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s, transform 0.3s",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <Check size={14} />
      Progress saved
    </div>
  );
};

export default ProgressSavedToast;

