export function LoadingScreen() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-warm-50">
      <h1 className="text-2xl font-bold text-primary-700 mb-6">Indivisible</h1>
      <svg
        width="64"
        height="48"
        viewBox="0 0 64 48"
        fill="none"
        className="animate-venn"
      >
        <circle cx="22" cy="24" r="18" stroke="#d4836a" strokeWidth="2.5" fill="none" opacity="0.8" />
        <circle cx="42" cy="24" r="18" stroke="#7fa686" strokeWidth="2.5" fill="none" opacity="0.8" />
        {/* Heart in the overlap */}
        <path
          d="M32 30 C32 30 27 25 27 22 C27 20 29 18 31 19.5 C31.7 20 32 20.5 32 20.5 C32 20.5 32.3 20 33 19.5 C35 18 37 20 37 22 C37 25 32 30 32 30Z"
          fill="#d4836a"
          opacity="0.6"
        />
      </svg>
      <style>{`
        @keyframes venn {
          0%, 100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.06);
            opacity: 1;
          }
        }
        .animate-venn {
          animation: venn 1.8s ease-in-out infinite;
        }
        .animate-venn circle:first-of-type {
          animation: venn-left 1.8s ease-in-out infinite;
        }
        .animate-venn circle:last-of-type {
          animation: venn-right 1.8s ease-in-out infinite;
        }
        @keyframes venn-left {
          0%, 100% { transform: translateX(3px); }
          50% { transform: translateX(0px); }
        }
        @keyframes venn-right {
          0%, 100% { transform: translateX(-3px); }
          50% { transform: translateX(0px); }
        }
      `}</style>
    </div>
  )
}
