import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useRef, useState } from "react";
import { X, Users, LogOut, Bot, Loader, ChevronDown } from "lucide-react";
import MessageInput from "./MessageInput";
import MessageRenderer from "./MessageRenderer";
import { formatMessageTime } from "../lib/utils";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const GroupChatContainer = () => {
  const {
    selectedGroup,
    setSelectedGroup,
    groupMessages,
    getGroupMessages,
    isGroupMessagesLoading,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
    leaveGroup,
  } = useGroupStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  // AI panel state
  const [showAI, setShowAI] = useState(false);
  const [aiMode, setAiMode] = useState("summary");
  const [aiResult, setAiResult] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    getGroupMessages(selectedGroup._id);
    subscribeToGroupMessages();
    return () => unsubscribeFromGroupMessages();
  }, [selectedGroup._id, getGroupMessages, subscribeToGroupMessages, unsubscribeFromGroupMessages]);

  useEffect(() => {
    if (messageEndRef.current && groupMessages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [groupMessages]);

  const handleAI = async (mode) => {
    if (groupMessages.length === 0) return toast.error("No messages to analyze");
    setIsAiLoading(true);
    setAiResult("");
    try {
      const msgs = groupMessages.slice(-20).map((m) => ({
        senderId: m.senderId?._id || m.senderId,
        senderName: m.senderId?.fullName || "Unknown",
        text: m.text || "",
      }));
      const res = await axiosInstance.post("/ai/process", {
        messages: msgs,
        mode,
        groupName: selectedGroup.name,
      });
      setAiResult(res.data.result);
    } catch (err) {
      toast.error("AI request failed");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleLeave = async () => {
    if (window.confirm(`Leave group "${selectedGroup.name}"?`)) {
      await leaveGroup(selectedGroup._id);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Group Header */}
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedGroup.groupPic ? (
              <img
                src={selectedGroup.groupPic}
                alt={selectedGroup.name}
                className="size-10 rounded-full object-cover"
              />
            ) : (
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="size-5 text-primary" />
              </div>
            )}
            <div>
              <h3 className="font-medium">{selectedGroup.name}</h3>
              <p className="text-sm text-base-content/70">
                {selectedGroup.members?.length} members
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

            {/* Leave Group */}
            <button
              onClick={handleLeave}
              className="btn btn-sm btn-ghost text-error"
              title="Leave group"
            >
              <LogOut className="size-4" />
            </button>

            {/* Close */}
            <button onClick={() => setSelectedGroup(null)}>
              <X className="size-5" />
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isGroupMessagesLoading ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : groupMessages.length === 0 ? (
          <div className="text-center text-base-content/50 py-10">
            No messages yet. Say hello! 👋
          </div>
        ) : (
          groupMessages.map((message) => {
            const senderId = message.senderId?._id || message.senderId;
            const isMe = senderId?.toString() === authUser._id?.toString();
            return (
              <div
                key={message._id}
                className={`chat ${isMe ? "chat-end" : "chat-start"}`}
                ref={messageEndRef}
              >
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border">
                    <img
                      src={
                        isMe
                          ? authUser.profilePic || "/avatar.png"
                          : message.senderId?.profilePic || "/avatar.png"
                      }
                      alt="profile"
                    />
                  </div>
                </div>
                <div className="chat-header mb-1 flex items-baseline gap-2">
                  {!isMe && (
                    <span className="text-xs font-semibold text-primary">
                      {message.senderId?.fullName || "Unknown"}
                    </span>
                  )}
                  <time className="text-xs opacity-50">
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>
                <div className="chat-bubble flex flex-col max-w-[85%]">
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="sm:max-w-[200px] rounded-md mb-2"
                    />
                  )}
                  {message.text && <MessageRenderer text={message.text} />}
                  {message.translatedText && message.translatedText !== message.text && (
                    <p className="text-xs opacity-60 mt-1 italic border-t border-white/20 pt-1">
                      🌍 {message.translatedText}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message Input — reuse with group context */}
      <MessageInput isGroup groupId={selectedGroup._id} />
    </div>
  );
};

export default GroupChatContainer;
