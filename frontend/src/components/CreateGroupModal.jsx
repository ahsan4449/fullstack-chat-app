import { useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { X, ImagePlus, Users } from "lucide-react";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupPicPreview, setGroupPicPreview] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef(null);

  const { users } = useChatStore();
  const { createGroup } = useGroupStore();

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setGroupPicPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    if (selectedMembers.length === 0) return;

    setIsCreating(true);
    const result = await createGroup({
      name: groupName.trim(),
      description: description.trim(),
      members: selectedMembers,
      groupPic: groupPicPreview || "",
    });

    if (result) {
      // Reset form and close
      setGroupName("");
      setDescription("");
      setSelectedMembers([]);
      setGroupPicPreview(null);
      onClose();
    }
    setIsCreating(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[85vh] flex flex-col overflow-hidden border border-base-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Create Group
          </h2>
          <button
            onClick={onClose}
            className="btn btn-circle btn-ghost btn-sm"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Group Picture */}
          <div className="flex justify-center">
            <div
              className="relative cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="size-20 rounded-full bg-base-300 flex items-center justify-center overflow-hidden border-2 border-dashed border-base-content/20 group-hover:border-primary transition-colors">
                {groupPicPreview ? (
                  <img
                    src={groupPicPreview}
                    alt="Group"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImagePlus className="size-8 text-base-content/40 group-hover:text-primary transition-colors" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
            </div>
          </div>

          {/* Group Name */}
          <div>
            <label className="label">
              <span className="label-text font-medium">Group Name *</span>
            </label>
            <input
              type="text"
              placeholder="Enter group name..."
              className="input input-bordered w-full"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">
              <span className="label-text font-medium">Description</span>
            </label>
            <input
              type="text"
              placeholder="What's this group about?"
              className="input input-bordered w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Member Selection */}
          <div>
            <label className="label">
              <span className="label-text font-medium">
                Add Members * ({selectedMembers.length} selected)
              </span>
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto border border-base-300 rounded-lg p-2">
              {users.map((user) => (
                <label
                  key={user._id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedMembers.includes(user._id)
                      ? "bg-primary/10"
                      : "hover:bg-base-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={selectedMembers.includes(user._id)}
                    onChange={() => toggleMember(user._id)}
                  />
                  <img
                    src={user.profilePic || "/avatar.svg"}
                    alt={user.fullName}
                    className="size-8 rounded-full object-cover"
                  />
                  <span className="text-sm font-medium">{user.fullName}</span>
                </label>
              ))}
              {users.length === 0 && (
                <p className="text-center text-sm text-base-content/50 py-4">
                  No contacts available
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-300">
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedMembers.length === 0 || isCreating}
            className="btn btn-primary w-full"
          >
            {isCreating ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              "Create Group"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
