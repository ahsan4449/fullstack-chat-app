import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <header className="fixed w-full top-0 z-40">
      {/* Mobile gradient bar */}
      <div
        className="lg:hidden flex items-center justify-between px-5 h-16"
        style={{
          background: "linear-gradient(135deg, var(--color-primary, #6366f1) 0%, var(--color-secondary, #8b5cf6) 100%)",
        }}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-white/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white tracking-wide">SyncTalk</h1>
        </Link>

        <div className="flex items-center gap-1">
          <Link to="/settings" className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Desktop bar (unchanged look) */}
      <div className="hidden lg:flex items-center justify-between px-4 h-16 bg-base-100/90 backdrop-blur-lg border-b border-base-300">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-lg font-bold">SyncTalk</h1>
        </Link>

        <div className="flex items-center gap-1">
          <Link to="/settings" className="btn btn-sm btn-ghost gap-1.5">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
          {authUser && (
            <>
              <Link to="/profile" className="btn btn-sm btn-ghost gap-1.5">
                <User className="size-5" />
                <span>Profile</span>
              </Link>
              <button className="btn btn-sm btn-ghost gap-1.5" onClick={logout}>
                <LogOut className="size-5" />
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;