import { useState, useRef, useEffect } from "react";
import { useMemoryStore } from "../store/useMemoryStore";
import { Brain, Send, Trash2, Clock, Tag, Star, X, RefreshCw, ArrowLeft } from "lucide-react";
import MessageRenderer from "./MessageRenderer";

// ── Memory Panel (right sidebar) ───────────────────────────────────────────
const MemoryPanel = ({ memories, onDelete, onRefresh }) => {
  const typeColor = {
    event: "badge-primary",
    fact: "badge-secondary",
    preference: "badge-accent",
    reminder: "badge-warning",
  };

  const typeIcon = {
    event: "📅",
    fact: "📌",
    preference: "⭐",
    reminder: "🔔",
  };

  return (
    <div className="w-full sm:w-72 border-l border-base-300 flex flex-col bg-base-100 h-full">
      <div className="p-4 border-b border-base-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="size-4 text-primary" />
          <span className="font-semibold text-sm">Memory Store</span>
          <span className="badge badge-primary badge-sm">{memories.length}</span>
        </div>
        <button onClick={onRefresh} className="btn btn-ghost btn-xs" title="Refresh">
          <RefreshCw className="size-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {memories.length === 0 ? (
          <div className="text-center text-base-content/40 text-xs py-8">
            <Brain className="size-8 mx-auto mb-2 opacity-30" />
            No memories yet. Start chatting!
          </div>
        ) : (
          memories.map((mem) => (
            <div
              key={mem._id}
              className="group relative bg-base-200 rounded-xl p-3 border border-base-300 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="text-sm">{typeIcon[mem.type] || "📝"}</span>
                    <span className={`badge badge-xs ${typeColor[mem.type] || "badge-ghost"}`}>
                      {mem.type}
                    </span>
                    {mem.reminderSet && (
                      <span className="badge badge-xs badge-warning">🔔 Reminder</span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{mem.entity}</p>
                  <p className="text-xs text-base-content/60 truncate">{mem.value}</p>
                  {mem.resolvedDate && (
                    <p className="text-xs text-primary/80 mt-0.5 flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(mem.resolvedDate).toDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onDelete(mem._id)}
                  className="opacity-0 group-hover:opacity-100 btn btn-ghost btn-xs text-error transition-opacity"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ── Message Bubble ─────────────────────────────────────────────────────────
const ChatBubble = ({ msg, authUser }) => {
  const isUser = msg.role === "user";
  return (
    <div className={`chat ${isUser ? "chat-end" : "chat-start"}`}>
      <div className="chat-image avatar">
        <div className="size-9 rounded-full border overflow-hidden">
          {isUser ? (
            <img src={authUser?.profilePic || "/avatar.png"} alt="You" />
          ) : (
            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
              <Brain className="size-5 text-primary" />
            </div>
          )}
        </div>
      </div>
      <div className={`chat-bubble max-w-[80%] ${isUser ? "" : "bg-base-200 text-base-content"}`}>
        <MessageRenderer text={msg.content} />
      </div>
    </div>
  );
};

// ── Main AI Memory Chat Component ──────────────────────────────────────────
const AiMemoryChat = ({ onClose }) => {
  const {
    memories,
    conversationHistory,
    isLoading,
    fetchMemories,
    checkReminders,
    sendMessage,
    deleteMemory,
    clearConversation,
  } = useMemoryStore();

  const { authUser } = { authUser: null }; // Will be grabbed from store below
  const [input, setInput] = useState("");
  const [showMemoryPanel, setShowMemoryPanel] = useState(false); // hidden by default on mobile
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Import auth store inline to avoid circular imports
  const [user, setUser] = useState(null);
  useEffect(() => {
    import("../store/useAuthStore").then(({ useAuthStore }) => {
      setUser(useAuthStore.getState().authUser);
    });
  }, []);

  useEffect(() => {
    fetchMemories();
    checkReminders();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationHistory, isLoading]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || isLoading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(msg);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const suggestedPrompts = [
    "My interview is on Monday",
    "Remind me before it",
    "I prefer Python over JavaScript",
    "My birthday is next Friday",
    "What do you remember about me?",
  ];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Chat Area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-base-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Back button — mobile only */}
            {onClose && (
              <button
                onClick={onClose}
                className="btn btn-ghost btn-sm btn-circle lg:hidden"
                aria-label="Back"
              >
                <ArrowLeft className="size-5" />
              </button>
            )}
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Memory Assistant</h3>
              <p className="text-xs text-base-content/50">
                Remembers facts, events & sets reminders
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowMemoryPanel((v) => !v)}
              className={`btn btn-sm btn-ghost gap-1 ${showMemoryPanel ? "text-primary" : ""}`}
              title="Toggle Memory Panel"
            >
              <Brain className="size-4" />
              <span className="hidden md:block text-xs">Memory</span>
            </button>
            <button onClick={clearConversation} className="btn btn-sm btn-ghost" title="Clear chat">
              <RefreshCw className="size-4" />
            </button>
            {onClose && (
              <button onClick={onClose} className="btn btn-sm btn-ghost hidden lg:flex" aria-label="Close">
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {conversationHistory.length === 0 && (
            <div className="text-center space-y-4 py-8">
              <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                <Brain className="size-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">AI Memory Chat</h3>
                <p className="text-sm text-base-content/50 mt-1">
                  Tell me anything. I'll remember it and resolve future references like "it" or "that".
                </p>
              </div>
              {/* Suggested prompts */}
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {suggestedPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => setInput(p)}
                    className="btn btn-xs btn-outline btn-primary rounded-full"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {conversationHistory.map((msg, i) => (
            <ChatBubble key={i} msg={msg} authUser={user} />
          ))}

          {isLoading && (
            <div className="chat chat-start">
              <div className="chat-image avatar">
                <div className="size-9 rounded-full bg-primary/20 flex items-center justify-center border">
                  <Brain className="size-5 text-primary animate-pulse" />
                </div>
              </div>
              <div className="chat-bubble bg-base-200 text-base-content">
                <span className="loading loading-dots loading-sm" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-base-300">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder='Try: "My interview is on Monday" then "Remind me before it"'
              className="flex-1 resize-none rounded-2xl border border-base-300 bg-base-200 px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors leading-relaxed"
              style={{ maxHeight: "120px" }}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="btn btn-primary btn-circle btn-sm mb-0.5"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Memory Panel ─────────────────────────────────────────────── */}
      {showMemoryPanel && (
        <MemoryPanel
          memories={memories}
          onDelete={deleteMemory}
          onRefresh={fetchMemories}
        />
      )}
    </div>
  );
};

export default AiMemoryChat;
