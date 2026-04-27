import { useRef, useState, useCallback } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { Image, Send, X, Timer } from "lucide-react";
import toast from "react-hot-toast";

const TTL_OPTIONS = [
  { label: "Off", value: null },
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
  { label: "1h", value: 3600 },
];

const MessageInput = ({ isGroup = false, groupId = null }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [ttl, setTtl] = useState(null); // seconds, null = permanent
  const [showTtlMenu, setShowTtlMenu] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const { sendMessage } = useChatStore();
  const { sendGroupMessage } = useGroupStore();

  // Auto-resize textarea vertically like WhatsApp
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px"; // max ~6 lines
  }, []);

  const handleTextChange = (e) => {
    setText(e.target.value);
    autoResize();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      if (isGroup) {
        await sendGroupMessage({ text: text.trim(), image: imagePreview, ttl });
      } else {
        await sendMessage({ text: text.trim(), image: imagePreview, ttl });
      }
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Send on Enter, new line on Shift+Enter (like WhatsApp)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="p-3 w-full border-t border-base-300">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-end gap-2">
      {/* Self-destruct TTL selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowTtlMenu((v) => !v)}
          className={`btn btn-circle btn-sm mb-0.5 shrink-0 ${
            ttl ? "text-orange-400 border-orange-400/40" : "text-zinc-400"
          }`}
          title="Self-destruct timer"
        >
          <Timer size={16} />
        </button>
        {showTtlMenu && (
          <div className="absolute bottom-12 left-0 bg-base-100 border border-base-300 rounded-xl shadow-xl overflow-hidden z-50">
            {TTL_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => { setTtl(opt.value); setShowTtlMenu(false); }}
                className={`w-full px-4 py-2 text-sm text-left hover:bg-base-200 transition-colors ${
                  ttl === opt.value ? "text-primary font-semibold" : ""
                }`}
              >
                {opt.value ? `💣 ${opt.label}` : "🔒 Off (permanent)"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Image upload */}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageChange}
        />
        <button
          type="button"
          className={`btn btn-circle btn-sm mb-0.5 shrink-0 ${
            imagePreview ? "text-emerald-500" : "text-zinc-400"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Image size={18} />
        </button>

        {/* Auto-growing textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-base-300 bg-base-200 px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors leading-relaxed overflow-y-auto"
          style={{ maxHeight: "160px" }}
          placeholder="Type a message... (Shift+Enter for new line)"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
        />

        {/* Send button */}
        <button
          type="submit"
          className="btn btn-circle btn-sm btn-primary mb-0.5 shrink-0"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;