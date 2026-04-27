import { useState } from "react";
import { X, Bot, Loader } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, messages } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const [showAI, setShowAI] = useState(false);
  const [aiMode, setAiMode] = useState("summary");
  const [aiResult, setAiResult] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAI = async (mode) => {
    if (!messages || messages.length === 0)
      return toast.error("No messages to analyze");
    setIsAiLoading(true);
    setAiResult("");
    try {
      const msgs = messages.slice(-20).map((m) => ({
        senderId: m.senderId,
        text: m.text || "",
      }));
      const res = await axiosInstance.post("/ai/process", { messages: msgs, mode });
      setAiResult(res.data.result);
    } catch {
      toast.error("AI request failed");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Button */}
          <button
            onClick={() => setShowAI(!showAI)}
            className={`btn btn-sm btn-ghost gap-1 ${showAI ? "text-primary" : ""}`}
            title="AI Assistant"
          >
            <Bot className="size-4" />
            <span className="hidden md:block text-xs">AI</span>
          </button>

          {/* Close button */}
          <button onClick={() => setSelectedUser(null)}>
            <X />
          </button>
        </div>
      </div>

      {/* AI Panel */}
      {showAI && (
        <div className="mt-3 p-3 bg-base-200 rounded-xl border border-base-300 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {["summary", "reply", "sentiment"].map((mode) => (
              <button
                key={mode}
                onClick={() => { setAiMode(mode); handleAI(mode); }}
                className={`btn btn-xs capitalize ${aiMode === mode ? "btn-primary" : "btn-ghost"}`}
              >
                {mode === "summary" ? "📋 Summary" : mode === "reply" ? "💬 Reply Ideas" : "😊 Sentiment"}
              </button>
            ))}
          </div>
          {isAiLoading && (
            <div className="flex items-center gap-2 text-sm text-base-content/60">
              <Loader className="size-4 animate-spin" /> Thinking...
            </div>
          )}
          {aiResult && !isAiLoading && (
            <div className="text-sm bg-base-100 rounded-lg p-3 whitespace-pre-wrap border border-base-300">
              {aiResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default ChatHeader;