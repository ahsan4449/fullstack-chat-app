import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";
import { useChatStore } from "./useChatStore.js";

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupsLoading: false,
  isGroupMessagesLoading: false,

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  createGroup: async (data) => {
    try {
      const res = await axiosInstance.post("/groups", data);
      set({ groups: [...get().groups, res.data] });
      toast.success("Group created successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create group");
      return null;
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load messages");
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  sendGroupMessage: async (messageData) => {
    const { selectedGroup, groupMessages } = get();
    try {
      const res = await axiosInstance.post(
        `/groups/${selectedGroup._id}/messages`,
        messageData
      );
      set({ groupMessages: [...groupMessages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send message");
    }
  },

  setSelectedGroup: (group) => {
    // Clear DM selection when a group is selected
    useChatStore.getState().setSelectedUser(null);
    set({ selectedGroup: group, groupMessages: [] });
  },

  subscribeToGroupMessages: () => {
    const { selectedGroup } = get();
    if (!selectedGroup) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newGroupMessage", (newMessage) => {
      // Only add if it's for the currently selected group
      if (newMessage.groupId !== selectedGroup._id) return;

      set({
        groupMessages: [...get().groupMessages, newMessage],
      });
    });
  },

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newGroupMessage");
    }
  },

  leaveGroup: async (groupId) => {
    try {
      await axiosInstance.post(`/groups/${groupId}/leave`);
      set({
        groups: get().groups.filter((g) => g._id !== groupId),
        selectedGroup: null,
        groupMessages: [],
      });
      toast.success("You left the group");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to leave group");
    }
  },

  addMembers: async (groupId, memberIds) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}/members`, {
        memberIds,
      });
      // Update the group in the list
      set({
        groups: get().groups.map((g) =>
          g._id === groupId ? res.data : g
        ),
        selectedGroup:
          get().selectedGroup?._id === groupId ? res.data : get().selectedGroup,
      });
      toast.success("Members added successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add members");
    }
  },

  removeMember: async (groupId, userId) => {
    try {
      const res = await axiosInstance.delete(
        `/groups/${groupId}/members/${userId}`
      );
      set({
        groups: get().groups.map((g) =>
          g._id === groupId ? res.data : g
        ),
        selectedGroup:
          get().selectedGroup?._id === groupId ? res.data : get().selectedGroup,
      });
      toast.success("Member removed");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to remove member");
    }
  },

  muteMember: async (groupId, userId) => {
    try {
      const res = await axiosInstance.put(
        `/groups/${groupId}/mute/${userId}`
      );
      set({
        groups: get().groups.map((g) =>
          g._id === groupId ? res.data : g
        ),
        selectedGroup:
          get().selectedGroup?._id === groupId ? res.data : get().selectedGroup,
      });
      toast.success("Member muted");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to mute member");
    }
  },

  unmuteMember: async (groupId, userId) => {
    try {
      const res = await axiosInstance.put(
        `/groups/${groupId}/unmute/${userId}`
      );
      set({
        groups: get().groups.map((g) =>
          g._id === groupId ? res.data : g
        ),
        selectedGroup:
          get().selectedGroup?._id === groupId ? res.data : get().selectedGroup,
      });
      toast.success("Member unmuted");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to unmute member");
    }
  },

  // Handle socket events for group updates
  setupGroupSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newGroup", (group) => {
      set({ groups: [...get().groups, group] });
      toast.success(`You were added to "${group.name}"`);
    });

    socket.on("groupUpdated", (updatedGroup) => {
      set({
        groups: get().groups.map((g) =>
          g._id === updatedGroup._id ? updatedGroup : g
        ),
        selectedGroup:
          get().selectedGroup?._id === updatedGroup._id
            ? updatedGroup
            : get().selectedGroup,
      });
    });

    socket.on("removedFromGroup", (groupId) => {
      set({
        groups: get().groups.filter((g) => g._id !== groupId),
        selectedGroup:
          get().selectedGroup?._id === groupId ? null : get().selectedGroup,
        groupMessages:
          get().selectedGroup?._id === groupId ? [] : get().groupMessages,
      });
      toast("You were removed from a group", { icon: "👋" });
    });

    socket.on("mutedInGroup", (groupId) => {
      toast("You have been muted by the admin", { icon: "🔇" });
    });

    socket.on("unmutedInGroup", (groupId) => {
      toast("You have been unmuted by the admin", { icon: "🔊" });
    });
  },

  cleanupGroupSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newGroup");
    socket.off("groupUpdated");
    socket.off("removedFromGroup");
    socket.off("mutedInGroup");
    socket.off("unmutedInGroup");
  },
}));

