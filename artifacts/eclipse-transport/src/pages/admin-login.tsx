import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { setAdminToken } from "@/lib/admin-auth";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import eclipseLogo from "@assets/2ffa0a51-9a8e-4247-9c64-59cc3df41776_1785877108692.png";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const adminLogin = useAdminLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    adminLogin.mutate(
      { data: { password } },
      {
        onSuccess: (data) => {
          setAdminToken(data.token);
          setLocation("/admin");
        },
        onError: () => {
          setError("Incorrect password. Please try again.");
          setPassword("");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <img
            src={eclipseLogo}
            alt="Eclipse Transport"
            className="h-36 w-auto object-contain mb-6 opacity-95"
          />
          <div className="flex items-center gap-2 text-white/40">
            <Shield className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold">Admin Panel</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <h1 className="text-xl font-semibold text-white mb-1">Sign In</h1>
          <p className="text-white/40 text-sm mb-6">Exclusive access for administrators</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl text-white text-sm px-4 pr-12 outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
                  required
                  data-testid="input-admin-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-xs font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={adminLogin.isPending || !password}
              className="w-full h-12 bg-white text-[#0A0A0A] text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              data-testid="button-admin-login"
            >
              {adminLogin.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Eclipse Transport © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
