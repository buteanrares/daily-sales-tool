"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const { error: resetError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/signin"); // Redirect to sign in page after successful password reset
        }, 2000); // Redirect after 2 seconds
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-[700px] max-w-md text-center">
        <h1 className="mb-6 text-2xl font-bold">Reset Your Password</h1>
        {error && <p className="mb-4 text-red-500">{error}</p>}
        {success && (
          <p className="mb-4 text-green-500">
            Password reset successfully! Redirecting to sign in...
          </p>
        )}
        <input
          type="password"
          className="w-full p-3 mb-4 border border-gray-300 rounded"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={loading}
        />
        <button
          className={`w-full py-3 ${
            loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-700"
          } text-white rounded`}
          onClick={handleResetPassword}
          disabled={loading}
        >
          {loading ? "Resetting Password..." : "Reset Password"}
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;
