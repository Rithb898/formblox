import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="font-mono text-[11px] text-[#6B6B6B]">
          &copy; {new Date().getFullYear()} FormBlox. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="/terms"
            className="font-mono text-[11px] text-[#6B6B6B] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#F2F2F2]"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="font-mono text-[11px] text-[#6B6B6B] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#F2F2F2]"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
