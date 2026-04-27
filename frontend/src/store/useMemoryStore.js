import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useMemoryStore = create((set, get) => ({
  memories: [],
  pendingReminders: [],
  conversationHistory: [], // [{role:"user"|"assistant", content:"..."}]
  isLoading: false,
  isChatOpen: false,

  setIsChatOpen: (val) => set({ isChatOpen: val }),

  // ── Fetch all memories ──────────────────────────────────────────────────
  fetchMemories: async () => {
    try {
      const res = await axiosInstance.get("/memory");
      set({ memories: res.data });
    } catch {
      // Silently fail
    }
  },

  // ── Fetch pending reminders and surface them ────────────────────────────
  checkReminders: async () => {
    try {
      const res = await axiosInstance.get("/memory/reminders");
      set({ pendingReminders: res.data });
      // Surface a toast for each un-fired reminder
      for (const r of res.data) {
        const dateStr = r.resolvedDate
          ? new Date(r.resolvedDate).toDateString()
          : r.value;
        toast(
          `🔔 Reminder: Your ${r.entity} is ${dateStr}`,
          {
            duration: 8000,
            style: { background: "#1c1917", color: "#fef2f2", border: "1px solid #f59e0b" },
          }
        );
        // Mark as fired after showing
        await axiosInstance.patch(`/memory/${r._id}/fire`);
      }
    } catch {
      // Silently fail
    }
  },

  // ── Send a message in the memory chat ──────────────────────────────────
  sendMessage: async (message) => {
    if (!message.trim()) return;

    const { conversationHistory } = get();

    // Optimistically add user message
    const updatedHistory = [
      ...conversationHistory,
      { role: "user", content: message },
    ];
    set({ conversationHistory: updatedHistory, isLoading: true });

    try {
      const res = await axiosInstance.post("/memory/chat", {
        message,
        conversationHistory,
      });

      const { response, memoriesExtracted, resolvedEntity, isReminderRequest } =
        res.data;

      // Add assistant reply to history
      set({
        conversationHistory: [
          ...updatedHistory,
          { role: "assistant", content: response },
        ],
        isLoading: false,
      });

      // Refresh memory panel
      await get().fetchMemories();

      // Toast feedback for new memories
      if (memoriesExtracted?.length > 0) {
        const names = memoriesExtracted.map((m) => m.entity).join(", ");
        toast.success(`🧠 Remembered: ${names}`, { duration: 3000 });
      }

      if (isReminderRequest) {
        toast(`🔔 Reminder set!`, {
          duration: 3000,
          style: { background: "#1c1917", color: "#fef2f2", border: "1px solid #f59e0b" },
        });
      }

      return response;
    } catch (error) {
      set({ isLoading: false });
      toast.error("AI Memory chat failed.");
    }
  },

  // ── Delete a single memory ──────────────────────────────────────────────
  deleteMemory: async (id) => {
    try {
      await axiosInstance.delete(`/memory/${id}`);
      set({ memories: get().memories.filter((m) => m._id !== id) });
    } catch {
      toast.error("Failed to delete memory");
    }
  },

  // ── Clear conversation ──────────────────────────────────────────────────
  clearConversation: () => set({ conversationHistory: [] }),
}));
