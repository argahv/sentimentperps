"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { Trophy, Sword, Users, Star, ChevronDown, Check, Sparkles } from "lucide-react";

interface Quest {
  id: string;
  title: string;
  description: string;
  category: "trading" | "social" | "achievement";
  xpReward: number;
  target: number;
  current: number;
  progress: number;
  completed: boolean;
}

export function QuestBoard() {
  const { authenticated, login, ready } = usePrivy();
  const { wallets } = useWallets();
  
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [categoryExpanded, setCategoryExpanded] = useState<Record<string, boolean>>({
    trading: true,
    social: true,
    achievement: true,
  });

  const walletAddress = wallets.find(w => w.standardWallet?.name !== "Privy")?.address ?? wallets[0]?.address;

  const fetchQuests = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quests?wallet=${walletAddress}`);
      if (!res.ok) throw new Error("Failed to fetch quests");
      const data = await res.json();
      setQuests(data.quests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated && walletAddress) {
      fetchQuests();
    }
  }, [authenticated, walletAddress]);

  const toggleCategory = (category: string) => {
    setCategoryExpanded(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const completedCount = quests.filter(q => q.completed).length;
  const totalCount = quests.length;

  const groupedQuests = quests.reduce((acc, quest) => {
    if (!acc[quest.category]) acc[quest.category] = [];
    acc[quest.category].push(quest);
    return acc;
  }, {} as Record<string, Quest[]>);

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case "trading": return <Sword className="w-4 h-4 text-primary" />;
      case "social": return <Users className="w-4 h-4 text-warning" />;
      case "achievement": return <Trophy className="w-4 h-4 text-success" />;
      default: return <Star className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const renderContent = () => {
    if (!ready) return <div className="p-4 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

    if (!authenticated || !walletAddress) {
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <h3 className="font-display font-bold text-[#E8ECF1] mb-1">Connect to View Quests</h3>
          <p className="font-sans text-sm text-[#6B7A8D] mb-4">
            Gamify your trading experience and earn XP by completing quests.
          </p>
          <button 
            onClick={login}
            className="swiss-btn-accent px-6 py-2 rounded-md font-bold text-sm text-[#E8ECF1]"
          >
            Connect Wallet
          </button>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-10 h-10 bg-[#1E2330] rounded-md"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-[#1E2330] rounded w-3/4"></div>
                <div className="h-3 bg-[#1E2330] rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6 text-center">
          <p className="font-sans text-sm text-primary mb-3">{error}</p>
          <button 
            onClick={fetchQuests}
            className="swiss-btn-outline px-4 py-1.5 rounded-md font-bold text-xs text-[#E8ECF1]"
          >
            Retry
          </button>
        </div>
      );
    }

    if (quests.length === 0) {
      return (
        <div className="p-6 text-center text-[#6B7A8D] font-sans text-sm">
          No quests available at the moment.
        </div>
      );
    }

    return (
      <div className="p-3 space-y-4">
        {Object.entries(groupedQuests).map(([category, categoryQuests]) => (
          <div key={category} className="shadow-neu-inset bg-[#181C26] rounded-md overflow-hidden border border-[#2A3040]">
            <button 
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-3 bg-[#1E2330] hover:bg-[#2A3040]/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {renderCategoryIcon(category)}
                <span className="font-display font-bold text-sm text-[#E8ECF1] capitalize">{category} Quests</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-[#6B7A8D] transition-transform ${categoryExpanded[category] ? "rotate-180" : ""}`} />
            </button>
            
            {categoryExpanded[category] && (
              <div className="p-2 space-y-2">
                {categoryQuests.map(quest => (
                  <div 
                    key={quest.id} 
                    className={`p-3 rounded-md border transition-all ${
                      quest.completed 
                        ? "border-success/50 bg-success/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]" 
                        : "border-[#2A3040] bg-[#12151C]"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-display font-bold text-sm text-[#E8ECF1] truncate">{quest.title}</h4>
                          {quest.completed && <Check className="w-3.5 h-3.5 text-success shrink-0" />}
                        </div>
                        <p className="font-sans text-xs text-[#6B7A8D]">{quest.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#1E2330] px-2 py-1 rounded shadow-neu-inset shrink-0">
                        <Sparkles className="w-3 h-3 text-warning" />
                        <span className="font-mono text-xs font-bold text-warning">+{quest.xpReward} XP</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="font-sans text-[10px] text-[#6B7A8D] uppercase tracking-wider font-semibold">Progress</span>
                        <span className="font-mono text-xs text-[#E8ECF1]">
                          {quest.current} / {quest.target}
                        </span>
                      </div>
                      <div className="h-1 bg-[#1E2330] shadow-neu-inset rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${quest.completed ? "bg-success" : quest.progress > 0 ? "bg-primary" : "bg-[#6B7A8D]/20"}`}
                          style={{ width: `${Math.min(100, Math.max(0, quest.progress))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flat-card rounded-lg overflow-hidden border border-[#2A3040] bg-[#12151C] industrial-screws relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-[#181C26] hover:bg-[#1E2330] transition-colors relative z-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1E2330] shadow-neu-inset flex items-center justify-center">
            <Trophy className="w-4 h-4 text-warning" />
          </div>
          <div className="text-left">
            <h2 className="font-display font-bold text-[#E8ECF1] text-base">Quests</h2>
            {authenticated && quests.length > 0 && (
              <p className="font-mono text-xs text-[#6B7A8D]">
                {completedCount}/{totalCount} Complete
              </p>
            )}
          </div>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-[#6B7A8D] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} 
        />
      </button>
      
      <div 
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{ 
          maxHeight: isExpanded ? "2000px" : "0px",
          opacity: isExpanded ? 1 : 0
        }}
      >
        <div className="border-t border-[#2A3040] bg-[#181C26]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
