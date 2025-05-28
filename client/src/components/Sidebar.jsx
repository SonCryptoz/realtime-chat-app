import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import SearchInput from "./SearchInput";

const Sidebar = () => {
    const {
        users,
        selectedUser,
        setSelectedUser,
        isUserLoading,
        unreadMessages,
    } = useChatStore();

    const { onlineUsers } = useAuthStore();
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const { getUsers, getUnreadMessages } = useChatStore.getState();

        getUsers();
        getUnreadMessages();
    }, []);

    const filteredUsers = users
        .filter((user) =>
            showOnlineOnly ? onlineUsers.includes(user._id) : true,
        )
        .filter((user) =>
            user.fullName.toLowerCase().includes(searchTerm.toLowerCase()),
        );

    if (isUserLoading) {
        return <SidebarSkeleton />;
    }

    return (
        <aside className="w-full md:w-72 lg:w-72 md:h-full md:border-r border-base-300 flex flex-col transition-all duration-200">
            {/* Header */}
            <div className="border-b border-base-300 w-full p-5">
                <div className="flex items-center gap-2">
                    <Users className="size-6 hidden" />
                    <span className="font-medium hidden lg:block">
                        Contacts
                    </span>
                </div>

                {/* Search */}
                <div className="mt-3 lg:block w-full">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search users..."
                        debounce={300}
                    />
                </div>

                {/* Online filter toggle */}
                <div className="mt-3 flex items-center gap-2">
                    <label className="cursor-pointer flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={showOnlineOnly}
                            onChange={(e) =>
                                setShowOnlineOnly(e.target.checked)
                            }
                            className="checkbox checkbox-sm"
                        />
                        <span className="text-sm">Show online people</span>
                    </label>
                    <span className="text-xs text-zinc-500">
                        ({onlineUsers.length - 1})
                    </span>
                </div>
            </div>

            {/* Users List */}
            <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto w-full">
                {filteredUsers.map((user) => (
                    <button
                        key={user._id}
                        onClick={() => setSelectedUser(user)}
                        className={`flex-shrink-0 p-3 flex flex-col md:flex-row items-center md:items-start gap-3 text-left hover:bg-base-300 transition-colors ${
                            selectedUser?._id === user._id
                                ? "bg-base-300 ring-1 ring-base-300"
                                : ""
                        }`}
                    >
                        <div className="relative">
                            <img
                                src={user.profilePicture || "/avatar.png"}
                                alt={user.name}
                                className="size-12 object-cover rounded-full"
                            />
                            {onlineUsers.includes(user._id) && (
                                <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                            )}
                            {unreadMessages[user._id] > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
                                    {unreadMessages[user._id]}
                                </span>
                            )}
                        </div>

                        <div className="hidden md:block min-w-0">
                            <div
                                className="font-medium truncate"
                                title={user.fullName}
                            >
                                {user.fullName}
                            </div>
                            <div className="text-sm text-zinc-400">
                                {onlineUsers.includes(user._id)
                                    ? "Online"
                                    : "Offline"}
                            </div>
                        </div>
                    </button>
                ))}

                {filteredUsers.length === 0 && (
                    <div className="flex justify-center items-center text-zinc-500 w-full h-full">
                        No users found
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
