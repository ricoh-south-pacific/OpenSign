import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import Parse from "parse";
import Loader from "../primitives/Loader";

function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const lengthValid = password.length >= 8;
  const caseDigitValid =
    /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
  const specialCharValid = /[!@#$%^&*()\-_=+{};:,<.>]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const allValid = lengthValid && caseDigitValid && specialCharValid && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allValid) return;

    setIsLoading(true);
    setError("");
    try {
      await Parse.Cloud.run("acceptinvite", { token, password });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Something went wrong. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex justify-center items-center h-[100vh] bg-base-200">
        <div className="bg-base-100 shadow rounded-box p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-error mb-2">Invalid Link</h2>
          <p className="text-sm">This invite link is invalid or missing a token.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex justify-center items-center h-[100vh] bg-base-200">
        <div className="bg-base-100 shadow rounded-box p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-success mb-2">Password Set Successfully</h2>
          <p className="text-sm mb-4">Your account is ready. You can now sign in.</p>
          <button
            onClick={() => navigate("/")}
            className="op-btn op-btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-[100vh] bg-base-200">
      <div className="bg-base-100 shadow rounded-box p-6 max-w-md w-full relative">
        {isLoading && (
          <div className="absolute w-full h-full inset-0 flex justify-center items-center bg-base-content/30 z-50 rounded-box">
            <Loader />
          </div>
        )}
        <h2 className="text-xl font-bold mb-1">Set Your Password</h2>
        <p className="text-sm text-base-content/70 mb-4">
          Create a password to activate your account.
        </p>
        {error && (
          <div className="bg-error/10 text-error text-sm p-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="op-input op-input-bordered op-input-sm text-xs w-full"
                placeholder="Enter password"
                required
              />
              <span
                className="absolute top-[50%] right-[10px] -translate-y-[50%] cursor-pointer text-base-content"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fa fa-eye${showPassword ? "-slash" : ""}`} />
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="op-input op-input-bordered op-input-sm text-xs w-full"
                placeholder="Confirm password"
                required
              />
              <span
                className="absolute top-[50%] right-[10px] -translate-y-[50%] cursor-pointer text-base-content"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <i className={`fa fa-eye${showConfirmPassword ? "-slash" : ""}`} />
              </span>
            </div>
          </div>
          {password.length > 0 && (
            <div className="text-[11px]">
              <p className={passwordsMatch ? "text-green-600" : "text-red-600"}>
                {passwordsMatch ? "\u2713" : "\u2717"} Passwords match
              </p>
              <p className={lengthValid ? "text-green-600" : "text-red-600"}>
                {lengthValid ? "\u2713" : "\u2717"} At least 8 characters
              </p>
              <p className={caseDigitValid ? "text-green-600" : "text-red-600"}>
                {caseDigitValid ? "\u2713" : "\u2717"} Uppercase, lowercase, and number
              </p>
              <p className={specialCharValid ? "text-green-600" : "text-red-600"}>
                {specialCharValid ? "\u2713" : "\u2717"} Special character
              </p>
            </div>
          )}
          <button
            type="submit"
            disabled={!allValid}
            className="op-btn op-btn-primary mt-2 disabled:opacity-50"
          >
            Set Password
          </button>
        </form>
      </div>
    </div>
  );
}

export default AcceptInvite;
