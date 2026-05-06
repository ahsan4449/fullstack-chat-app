import { useEffect, useRef } from "react";
import { Copy, Trash2, CheckSquare, X } from "lucide-react";
import toast from "react-hot-toast";

/**
 * MessageContextMenu
 *
 * Props:
 *  - x, y          : position (px) relative to viewport
 *  - message        : the full message object
 *  - isOwn          : boolean — true if authUser is the sender
 *  - onClose        : fn() — close the menu
 *  - onDelete       : fn(messageId) — handle delete
 *  - selectedText   : currently selected text from the bubble (may be "")
 */
const MessageContextMenu = ({
  x,
  y,
  message,
  isOwn,
  onClose,
  onDelete,
  selectedText,
}) => {
  const menuRef = useRef(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  // Adjust position to stay inside viewport
  const menuStyle = (() => {
    const menuW = 180;
    const menuH = isOwn ? 130 : 90;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      left: Math.min(x, vw - menuW - 8),
      top:  Math.min(y, vh - menuH - 8),
    };
  })();

  const handleCopy = () => {
    const text = selectedText || message.text || "";
    if (!text) { toast("Nothing to copy"); onClose(); return; }
    navigator.clipboard.writeText(text).then(() => {
      toast.success(selectedText ? "Selected text copied!" : "Message copied!");
    }).catch(() => toast.error("Copy failed"));
    onClose();
  };

  const handleCopySelected = () => {
    const sel = window.getSelection()?.toString() || "";
    if (!sel) { toast("Select some text first"); return; }
    navigator.clipboard.writeText(sel).then(() => toast.success("Copied!")).catch(() => toast.error("Copy failed"));
    onClose();
  };

  const handleDelete = () => {
    onDelete(message._id);
    onClose();
  };

  const hasText = !!(message.text || "").trim();

  return (
    <div
      ref={menuRef}
      className="msg-context-menu"
      style={{ position: "fixed", zIndex: 9999, ...menuStyle }}
    >
      {/* Copy full message text */}
      {hasText && (
        <button className="ctx-item" onClick={handleCopy}>
          <Copy className="ctx-icon" />
          <span>{selectedText ? "Copy selected" : "Copy text"}</span>
        </button>
      )}

      {/* Copy only the browser selection */}
      {selectedText && (
        <button className="ctx-item" onClick={handleCopySelected}>
          <CheckSquare className="ctx-icon" />
          <span>Copy selection</span>
        </button>
      )}

      {/* Divider only if there will be a delete option below */}
      {isOwn && (hasText || message.image) && (
        <div className="ctx-divider" />
      )}

      {/* Delete — own messages only */}
      {isOwn && (
        <button className="ctx-item ctx-item--danger" onClick={handleDelete}>
          <Trash2 className="ctx-icon" />
          <span>Delete message</span>
        </button>
      )}
    </div>
  );
};

export default MessageContextMenu;
