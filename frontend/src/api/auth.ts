export async function checkPin(pin: string): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/check-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.token;
  } catch {
    return null;
  }
}