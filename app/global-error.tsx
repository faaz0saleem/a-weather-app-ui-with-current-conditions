"use client";

/** Last-resort error screen (root layout failed). Plain HTML — no app styles available. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#FBF6EE", color: "#1A1612", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <p style={{ fontSize: 48, margin: 0 }}>😵‍💫</p>
          <h1 style={{ fontSize: 22 }}>Kuch gadbad ho gayi.</h1>
          <button onClick={reset} style={{ background: "#F08A24", border: 0, borderRadius: 16, padding: "12px 20px", fontWeight: 700, fontSize: 16 }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
