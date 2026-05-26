import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#080808] px-4 py-12 gap-7 overflow-hidden">
      {/* Atmospheric glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
      >
        <div className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-[#E8854A] opacity-[0.10] blur-[140px]" />
        <div className="absolute -bottom-48 -right-40 h-[34rem] w-[34rem] rounded-full bg-[#3a5a7a] opacity-[0.06] blur-[150px]" />
      </div>

      {/* Wordmark */}
      <Link
        href="/"
        className="flex items-center gap-2 text-lg font-semibold tracking-tight text-[#F2F2F2] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-white"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-[#E8854A] shadow-[0_0_12px_2px_rgba(232,133,74,0.5)]" />
        Formblox
      </Link>

      <div className="w-full max-w-md">{children}</div>

      <p className="max-w-xs text-center text-xs leading-relaxed text-[#6B6B6B]">
        By clicking continue, you agree to our{" "}
        <Link
          href="/terms"
          className="underline decoration-white/20 underline-offset-2 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#F2F2F2]"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="underline decoration-white/20 underline-offset-2 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#F2F2F2]"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
