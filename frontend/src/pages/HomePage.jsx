import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useMemoryStore } from "../store/useMemoryStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";
import AiMemoryChat from "../components/AiMemoryChat";
import BottomNav from "../components/BottomNav";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { selectedGroup } = useGroupStore();
  const { isChatOpen, setIsChatOpen } = useMemoryStore();

  // Lifted from Sidebar so BottomNav can also control it
  const [activeTab, setActiveTab] = useState("chats");

  const hasChatOpen = selectedUser || selectedGroup || isChatOpen;

  const handleOpenAi = () => setIsChatOpen(true);

  const renderMain = () => {
    if (isChatOpen) return <AiMemoryChat onClose={() => setIsChatOpen(false)} />;
    if (selectedUser)  return <ChatContainer />;
    if (selectedGroup) return <GroupChatContainer />;
    return <NoChatSelected onOpenAiMemory={handleOpenAi} />;
  };

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-16 px-0 sm:px-4">
        {/* Subtract navbar (4rem) + bottom-nav (4rem) on mobile; navbar + margin on desktop */}
        <div className="bg-base-100 sm:rounded-lg shadow-xl w-full max-w-6xl h-[calc(100dvh-8rem)] sm:h-[calc(100vh-8rem)]">
          <div className="flex h-full sm:rounded-lg overflow-hidden">

            {/* Sidebar: full-screen on mobile when no chat open */}
            <div className={`${hasChatOpen ? "hidden" : "flex"} lg:flex w-full lg:w-auto flex-shrink-0`}>
              <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            {/* Chat panel */}
            <div className={`${hasChatOpen ? "flex" : "hidden"} lg:flex flex-1 flex-col min-w-0`}>
              {renderMain()}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile bottom navigation — only visible when sidebar is shown */}
      {!hasChatOpen && (
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          aiActive={isChatOpen}
          onOpenAiMemory={handleOpenAi}
        />
      )}
    </div>
  );
};

export default HomePage;