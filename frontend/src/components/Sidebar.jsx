import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useGroupStore } from "../store/useGroupStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import CreateGroupModal from "./CreateGroupModal";
import { Users, Plus } from "lucide-react";
import { useState } from "react";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const {
    groups, getGroups, selectedGroup, setSelectedGroup,
    isGroupsLoading, setupGroupSocketListeners, cleanupGroupSocketListeners,
  } = useGroupStore();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
    getGroups();
    setupGroupSocketListeners();
    return () => cleanupGroupSocketListeners();
  }, [getUsers, getGroups, setupGroupSocketListeners, cleanupGroupSocketListeners]);

  const filteredUsers = showOnlineOnly
    ? users.filter((u) => onlineUsers.includes(u._id))
    : users;

  const onlineCount = Math.max(0, onlineUsers.length - 1);

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <>
      <aside className="h-full w-full lg:w-72 border-r border-base-300 flex flex-col">

        {/* ── Desktop Tab Header (hidden on mobile — BottomNav handles it) ── */}
        <div className="hidden lg:block border-b border-base-300 p-3">
          <div className="flex gap-1 bg-base-200 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("chats")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "chats" ? "bg-base-100 shadow text-primary" : "text-base-content/60 hover:text-base-content"
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "groups" ? "bg-base-100 shadow text-primary" : "text-base-content/60 hover:text-base-content"
              }`}
            >
              Groups
            </button>
          </div>
        </div>

        {/* ── Mobile section title ── */}
        <div className="lg:hidden flex items-center justify-between px-4 pt-3 pb-2">
          <span className="text-xs font-bold tracking-widest uppercase text-base-content/50">
            {activeTab === "chats" ? "Messages" : "Groups"}
          </span>
          {activeTab === "chats" && (
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-xs checkbox-primary"
              />
              <span className="text-xs text-base-content/50">
                Online <span className="text-primary font-semibold">({onlineCount})</span>
              </span>
            </label>
          )}
          {activeTab === "groups" && (
            <button
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center gap-1 text-xs font-semibold text-primary active:opacity-70"
            >
              <Plus className="size-3.5" /> New
            </button>
          )}
        </div>

        {/* ── Desktop online filter / create group ── */}
        <div className="hidden lg:block px-3 pb-3 border-b border-base-300">
          {activeTab === "chats" && (
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Online only</span>
              <span className="text-xs text-zinc-500">({onlineCount} online)</span>
            </label>
          )}
          {activeTab === "groups" && (
            <button
              onClick={() => setShowCreateGroup(true)}
              className="mt-1 flex w-full items-center gap-2 btn btn-sm btn-outline btn-primary"
            >
              <Plus className="size-4" /> New Group
            </button>
          )}
        </div>

        {/* ── List ── */}
        <div className="overflow-y-auto flex-1 py-1">
          {activeTab === "chats" ? (
            <>
              {filteredUsers.map((user) => {
                const isOnline = onlineUsers.includes(user._id);
                const isSelected = selectedUser?._id === user._id;
                return (
                  <button
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors duration-150 ${
                      isSelected ? "bg-primary/10 border-r-2 border-primary" : "hover:bg-base-200 active:bg-base-300"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={user.profilePic || "/avatar.png"}
                        alt={user.fullName}
                        className="size-12 object-cover rounded-full"
                      />
                      {isOnline && (
                        <span className="absolute bottom-0.5 right-0.5 size-2.5 bg-green-500 rounded-full ring-2 ring-base-100" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-semibold truncate text-sm">{user.fullName}</div>
                      <div className={`text-xs truncate ${isOnline ? "text-green-500 font-medium" : "text-base-content/40"}`}>
                        {isOnline ? "● Online" : "Offline"}
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredUsers.length === 0 && (
                <div className="text-center text-base-content/40 text-sm py-10">No users found</div>
              )}
            </>
          ) : (
            <>
              {isGroupsLoading ? (
                <div className="flex justify-center py-8"><span className="loading loading-spinner loading-md" /></div>
              ) : groups.length === 0 ? (
                <div className="text-center text-base-content/40 py-10 text-sm">
                  No groups yet.{" "}
                  <button className="text-primary underline" onClick={() => setShowCreateGroup(true)}>
                    Create one!
                  </button>
                </div>
              ) : (
                groups.map((group) => {
                  const isSelected = selectedGroup?._id === group._id;
                  return (
                    <button
                      key={group._id}
                      onClick={() => setSelectedGroup(group)}
                      className={`w-full px-4 py-3 flex items-center gap-3 transition-colors duration-150 ${
                        isSelected ? "bg-primary/10 border-r-2 border-primary" : "hover:bg-base-200 active:bg-base-300"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {group.groupPic ? (
                          <img src={group.groupPic} alt={group.name} className="size-12 object-cover rounded-full" />
                        ) : (
                          <div className="size-12 rounded-full bg-primary/15 flex items-center justify-center">
                            <Users className="size-6 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <div className="font-semibold truncate text-sm">{group.name}</div>
                        <div className="text-xs text-base-content/40">{group.members?.length} members</div>
                      </div>
                    </button>
                  );
                })
              )}
            </>
          )}
        </div>
      </aside>

      <CreateGroupModal isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)} />
    </>
  );
};

export default Sidebar;