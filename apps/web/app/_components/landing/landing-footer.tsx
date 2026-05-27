import Link from "next/link";
import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/6 px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Image
            src="/logo.png"
            alt="FormBlox"
            width={88}
            height={22}
            className="object-contain opacity-60"
          />
          <p className="font-mono text-[11px] text-[#6B6B6B]">
            &copy; {new Date().getFullYear()} FormBlox. All rights reserved.
          </p>
        </div>
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
