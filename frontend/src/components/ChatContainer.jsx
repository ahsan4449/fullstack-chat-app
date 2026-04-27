import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageRenderer from "./MessageRenderer";
import SelfDestructTimer from "./SelfDestructTimer";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { useSecurity } from "../hooks/useSecurity";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);

  // Local list so we can splice out expired/self-destruct messages
  const [localMessages, setLocalMessages] = useState([]);

  // Screenshot detection — silently notifies the other user, no UI change on sender
  useSecurity({ targetUserId: selectedUser?._id, enabled: true });

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (messageEndRef.current && localMessages.length) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [localMessages]);

  // ── Socket: remove self-destruct messages when they expire ────────────
  useEffect(() => {
    if (!socket) return;
    const handleExpired = ({ messageId }) => {
      setLocalMessages((prev) => prev.filter((m) => m._id !== messageId));
    };
    socket.on("messageExpired", handleExpired);
    return () => socket.off("messageExpired", handleExpired);
  }, [socket]);

  // ── Socket: screenshot alert — shown ONLY to the person being screenshotted ─
  useEffect(() => {
    if (!socket) return;
    const handleAlert = () => {
      toast("📸 Someone may have taken a screenshot of this chat.", {
        duration: 6000,
        style: { background: "#1c1917", color: "#fef2f2", border: "1px solid #ef4444" },
        icon: "⚠️",
      });
    };
    socket.on("screenshotAlert", handleAlert);
    return () => socket.off("screenshotAlert", handleAlert);
  }, [socket]);

  const handleLocalExpire = (messageId) => {
    setLocalMessages((prev) => prev.filter((m) => m._id !== messageId));
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {localMessages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>

            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
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
              {/* Self-destruct countdown */}
              {message.expiresAt && (
                <SelfDestructTimer
                  expiresAt={message.expiresAt}
                  onExpire={() => handleLocalExpire(message._id)}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;