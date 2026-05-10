import { MessageSquare, Users, Brain, User } from "lucide-react";
import { Link } from "react-router-dom";

const BottomNav = ({ activeTab, setActiveTab, aiActive, onOpenAiMemory }) => {
  const chatsActive  = activeTab === "chats"  && !aiActive;
  const groupsActive = activeTab === "groups" && !aiActive;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden flex h-16 bg-base-100 border-t border-base-300"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", boxShadow: "0 -4px 24px rgba(0,0,0,0.08)" }}
    >
      {/* Chats */}
      <button
        id="bnav-chats"
        onClick={() => setActiveTab("chats")}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 border-none bg-transparent cursor-pointer transition-all duration-200 active:scale-90 ${
          chatsActive ? "text-primary" : "text-base-content/35"
        }`}
      >
        <MessageSquare className={`size-[22px] ${chatsActive ? "drop-shadow-[0_0_6px_currentColor]" : ""}`} />
        <span className="text-[0.55rem] font-bold tracking-widest uppercase">Chats</span>
      </button>

      {/* Groups */}
      <button
        id="bnav-groups"
        onClick={() => setActiveTab("groups")}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 border-none bg-transparent cursor-pointer transition-all duration-200 active:scale-90 ${
          groupsActive ? "text-primary" : "text-base-content/35"
        }`}
      >
        <Users className={`size-[22px] ${groupsActive ? "drop-shadow-[0_0_6px_currentColor]" : ""}`} />
        <span className="text-[0.55rem] font-bold tracking-widest uppercase">Groups</span>
      </button>

      {/* AI Memory */}
      <button
        id="bnav-ai"
        onClick={onOpenAiMemory}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 border-none bg-transparent cursor-pointer transition-all duration-200 active:scale-90 ${
          aiActive ? "text-secondary" : "text-base-content/35"
        }`}
      >
        <Brain className={`size-[22px] ${aiActive ? "drop-shadow-[0_0_6px_currentColor]" : ""}`} />
        <span className="text-[0.55rem] font-bold tracking-widest uppercase">AI</span>
      </button>

      {/* Profile */}
      <Link
        to="/profile"
        id="bnav-profile"
        className="flex-1 flex flex-col items-center justify-center gap-0.5 text-base-content/35 no-underline transition-all duration-200 active:scale-90"
      >
        <User className="size-[22px]" />
        <span className="text-[0.55rem] font-bold tracking-widest uppercase">Profile</span>
      </Link>
    </nav>
  );
};

export default BottomNav;
