import { useState } from "react";
import { Check, Mail } from "lucide-react";

interface SaveProgressPromptProps {
  onSubmit: (email: string) => Promise<{ error: any }>;
  isAuthenticated: boolean;
}

const SaveProgressPrompt = ({ onSubmit, isAuthenticated }: SaveProgressPromptProps) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "sending") return;

    setStatus("sending");
    setErrorMsg("");

    const { error } = await onSubmit(email.trim());
    if (error) {
      setStatus("error");
      setErrorMsg(error.message || "Something went wrong. Try again.");
    } else {
      setStatus("sent");
    }
  };

  if (status === "sent") {
    return (
      <div
        style={{
          background: "#F0FFF5",
          border: "1px solid #D3FFE3",
          borderRadius: 12,
          padding: "16px 20px",
          margin: "12px 0",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Check size={18} color="#53D88B" />
        <p
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: 13,
            color: "#333",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Check your email for a magic link. Click it to save your progress and come back anytime.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #D3FFE3",
        borderRadius: 12,
        padding: "16px 20px",
        margin: "12px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Mail size={16} color="#53D88B" />
        <p
          style={{
            fontFamily: "'Secular One', sans-serif",
            fontSize: 14,
            color: "#53D88B",
            margin: 0,
          }}
        >
          Save your progress
        </p>
      </div>
      <p
        style={{
          fontFamily: "'Roboto', sans-serif",
          fontSize: 13,
          color: "#666",
          margin: "0 0 12px",
          lineHeight: 1.5,
        }}
      >
        Enter your email to come back to this later. No password needed — we'll send you a magic link.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ddd",
            fontSize: 14,
            fontFamily: "'Roboto', sans-serif",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={status === "sending" || !email.trim()}
          style={{
            background: status === "sending" ? "#a3e4bc" : "#53D88B",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'Roboto', sans-serif",
            cursor: status === "sending" ? "default" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {status === "sending" ? "Sending..." : "Save"}
        </button>
      </form>
      {status === "error" && (
        <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: 12, color: "#e55", margin: "8px 0 0" }}>
          {errorMsg}
        </p>
      )}
    </div>
  );
};

export default SaveProgressPrompt;

