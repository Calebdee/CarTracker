import { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [error, setError] = useState("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const clearDigits = () => {
    setDigits(["", "", "", ""]);
    inputs.current[0]?.focus();
  };

  const handleSubmit = async () => {
    if (attemptsLeft <= 0) return;

    const code = digits.join("");

    try {
      const res = await axios.post("/api/auth/check-pin", { pin: code });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        navigate("/dashboard");   
      } else {
        // Shouldn't hit this because backend uses 401, but leaving for safety.
        handleFailedAttempt();
      }
    } catch {
      handleFailedAttempt();
    }
  };

  const handleFailedAttempt = () => {
    const newAttempts = attemptsLeft - 1;
    setAttemptsLeft(newAttempts);

    if (newAttempts > 0) {
      setError(`Incorrect code. ${newAttempts} attempt${newAttempts !== 1 ? "s" : ""} remaining.`);
    } else {
      setError("Too many failed attempts. You are locked out.");
    }

    clearDigits();
  };

  const isComplete = digits.every((d) => d !== "");
  const isLocked = attemptsLeft <= 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-5">
      <div className="w-full max-w-sm bg-white shadow-md rounded-xl p-10">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Enter Access Code
        </h1>

        {error && (
          <p className="text-red-600 text-center mb-4 font-medium">
            {error}
          </p>
        )}

        <div className="flex justify-between mb-8">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputs.current[index] = el;
              }}
              type="text"
              maxLength={1}
              disabled={isLocked}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-14 h-16 border border-gray-300 rounded-lg text-center text-3xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isComplete || isLocked}
          className={`w-full py-4 rounded-full text-white text-lg font-medium transition
            ${
              !isLocked && isComplete
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-300 cursor-not-allowed"
            }
          `}
        >
          {isLocked ? "Locked Out" : "Verify now"}
        </button>
      </div>
    </div>
  );
}

