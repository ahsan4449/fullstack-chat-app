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

  const renderMain = () => {
    if (isChatOpen) return <AiMemoryChat onClose={() => setIsChatOpen(false)} />;
    if (selectedUser) return <ChatContainer />;
    if (selectedGroup) return <GroupChatContainer />;
    return <NoChatSelected onOpenAiMemory={() => setIsChatOpen(true)} />;
  };

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />
            {renderMain()}
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;