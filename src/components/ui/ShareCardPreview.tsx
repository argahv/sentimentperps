"use client";

export function ShareCardPreview({
  referralCode,
  totalEarnings,
  referralCount,
}: {
  referralCode: string;
  totalEarnings: number;
  referralCount: number;
}) {
  return (
    <div className="flex flex-col gap-3 card-entrance">
      <div
        className="w-full relative overflow-hidden border-2 border-border-muted bg-surface-muted text-white flex flex-col justify-center items-center p-8"
        style={{ aspectRatio: "1200 / 630" }}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at center, #ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>

        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-primary to-primary/50"></div>

        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
          <h2 className="text-primary font-display font-bold text-3xl md:text-5xl tracking-tight mb-8 uppercase">
            SentimentPerps
          </h2>
          
          <div className="bg-white/5 border border-white/10 px-8 py-6 mb-6">
            <p className="text-muted-foreground text-sm md:text-base font-medium text-center mb-2 uppercase tracking-widest">
              Referral Code
            </p>
            <p className="font-mono text-4xl md:text-6xl font-bold tracking-wider text-white">
              {referralCode}
            </p>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground font-medium text-base md:text-xl">
            <span className="tabular-nums">{referralCount} Referrals</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span className="tabular-nums text-success">${totalEarnings} Earned</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        This is what friends see when you share your link
      </p>
    </div>
  );
}
