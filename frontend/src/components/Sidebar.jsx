import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useGroupStore } from "../store/useGroupStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import CreateGroupModal from "./CreateGroupModal";
import { Users, MessageSquare, Plus } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const {
    groups,
    getGroups,
    selectedGroup,
    setSelectedGroup,
    isGroupsLoading,
    setupGroupSocketListeners,
    cleanupGroupSocketListeners,
  } = useGroupStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("chats"); // "chats" | "groups"
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    getUsers();
    getGroups();
    setupGroupSocketListeners();
    return () => cleanupGroupSocketListeners();
  }, [getUsers, getGroups, setupGroupSocketListeners, cleanupGroupSocketListeners]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <>
      <aside className="h-full w-full lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
        {/* Tab Header */}
        <div className="border-b border-base-300 w-full p-3">
          <div className="flex gap-1 bg-base-200 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("chats")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "chats"
                  ? "bg-base-100 shadow text-primary"
                  : "text-base-content/60 hover:text-base-content"
              }`}
            >
              <MessageSquare className="size-4" />
              <span className="lg:block">Chats</span>
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "groups"
                  ? "bg-base-100 shadow text-primary"
                  : "text-base-content/60 hover:text-base-content"
              }`}
            >
              <Users className="size-4" />
              <span className="lg:block">Groups</span>
            </button>
          </div>

          {/* Online filter — only show on Chats tab */}
          {activeTab === "chats" && (
            <div className="mt-2 flex items-center gap-2">
              <label className="cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showOnlineOnly}
                  onChange={(e) => setShowOnlineOnly(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
                <span className="text-sm">Online only</span>
              </label>
              <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
            </div>
          )}

          {/* Create Group button — only show on Groups tab */}
          {activeTab === "groups" && (
            <button
              onClick={() => setShowCreateGroup(true)}
              className="mt-2 flex w-full items-center gap-2 btn btn-sm btn-outline btn-primary"
            >
              <Plus className="size-4" />
              New Group
            </button>
          )}
          {activeTab === "groups" && (
            <button
              onClick={() => setShowCreateGroup(true)}
              className="mt-2 flex lg:hidden w-full items-center justify-center btn btn-sm btn-outline btn-primary"
            >
              <Plus className="size-4" />
              <span className="ml-1">New Group</span>
            </button>
          )}
        </div>

        {/* List */}
        <div className="overflow-y-auto w-full py-3">
          {activeTab === "chats" ? (
            <>
              {filteredUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
                    selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""
                  }`}
                >
                  <div className="relative mx-auto lg:mx-0">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.name}
                      className="size-12 object-cover rounded-full"
                    />
                    {onlineUsers.includes(user._id) && (
                      <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                    )}
                  </div>
                  <div className="text-left min-w-0">
                    <div className="font-medium truncate">{user.fullName}</div>
                    <div className="text-sm text-zinc-400">
                      {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                    </div>
                  </div>
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-center text-zinc-500 py-4">No online users</div>
              )}
            </>
          ) : (
            <>
              {isGroupsLoading ? (
                <div className="flex justify-center py-6">
                  <span className="loading loading-spinner loading-md" />
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center text-zinc-500 py-6 px-3 text-sm">
                  No groups yet.{" "}
                  <button
                    className="text-primary underline"
                    onClick={() => setShowCreateGroup(true)}
                  >
                    Create one!
                  </button>
                </div>
              ) : (
                groups.map((group) => (
                  <button
                    key={group._id}
                    onClick={() => setSelectedGroup(group)}
                    className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
                      selectedGroup?._id === group._id ? "bg-base-300 ring-1 ring-base-300" : ""
                    }`}
                  >
                    <div className="relative mx-auto lg:mx-0">
                      {group.groupPic ? (
                        <img
                          src={group.groupPic}
                          alt={group.name}
                          className="size-12 object-cover rounded-full"
                        />
                      ) : (
                        <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="size-6 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-medium truncate">{group.name}</div>
                      <div className="text-sm text-zinc-400 truncate">
                        {group.members?.length} members
                      </div>
                    </div>
                  </button>
                ))
              )}
            </>
          )}
        </div>
      </aside>

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />
    </>
  );
};

export default Sidebar;