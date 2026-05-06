import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useMemoryStore } from "../store/useMemoryStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";
import AiMemoryChat from "../components/AiMemoryChat";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { selectedGroup } = useGroupStore();
  const { isChatOpen, setIsChatOpen } = useMemoryStore();

  // Any active "chat" panel open?
  const hasChatOpen = selectedUser || selectedGroup || isChatOpen;

  const renderMain = () => {
    if (isChatOpen) return <AiMemoryChat onClose={() => setIsChatOpen(false)} />;
    if (selectedUser) return <ChatContainer />;
    if (selectedGroup) return <GroupChatContainer />;
    return <NoChatSelected onOpenAiMemory={() => setIsChatOpen(true)} />;
  };

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-16 sm:pt-20 px-0 sm:px-4">
        <div className="bg-base-100 sm:rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-4rem)] sm:h-[calc(100vh-8rem)]">
          <div className="flex h-full sm:rounded-lg overflow-hidden">

            {/* Sidebar: always visible on lg+, hidden on mobile when chat is open */}
            <div className={`
              ${hasChatOpen ? "hidden" : "flex"} lg:flex
              w-full lg:w-auto flex-shrink-0
            `}>
              <Sidebar />
            </div>

            {/* Chat panel: full-width on mobile when open, flex-1 on desktop */}
            <div className={`
              ${hasChatOpen ? "flex" : "hidden"} lg:flex
              flex-1 flex-col min-w-0
            `}>
              {renderMain()}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;