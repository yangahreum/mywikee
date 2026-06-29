"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorMsg(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "80px 24px" }}>
      <h1 style={{ fontSize: 32, margin: "0 0 24px" }}>로그인</h1>
      {status === "sent" ? (
        <p>메일함을 확인하세요. 매직링크를 보냈습니다.</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ padding: "10px 12px", border: "1px solid #c9ced4", borderRadius: 6 }}
          />
          <button
            type="submit"
            disabled={status === "sending"}
            style={{ padding: "10px 12px", background: "#1f5d4f", color: "#fff", border: "none", borderRadius: 6 }}
          >
            {status === "sending" ? "보내는 중…" : "매직링크 받기"}
          </button>
          {status === "error" && <p style={{ color: "#b00" }}>{errorMsg}</p>}
        </form>
      )}
    </main>
  );
}
