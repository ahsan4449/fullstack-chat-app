import { MessageSquare, Brain, Sparkles } from "lucide-react";

const NoChatSelected = ({ onOpenAiMemory }) => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50">
      <div className="max-w-md text-center space-y-8">
        {/* Icons */}
        <div className="flex justify-center gap-6 mb-2">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-bounce">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <div
            className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center animate-bounce"
            style={{ animationDelay: "150ms" }}
          >
            <Brain className="w-8 h-8 text-secondary" />
          </div>
        </div>

        {/* Welcome Text */}
        <div>
          <h2 className="text-2xl font-bold">Welcome to SyncTalk!</h2>
          <p className="text-base-content/60 mt-2">
            Select a conversation from the sidebar to start chatting, or try the AI Memory Assistant.
          </p>
        </div>

        {/* AI Memory CTA */}
        <button
          onClick={onOpenAiMemory}
          className="btn btn-primary gap-2 rounded-xl w-full max-w-xs mx-auto"
        >
          <Sparkles className="size-4" />
          Open AI Memory Chat
        </button>

        <p className="text-xs text-base-content/40">
          Remembers facts · Resolves "it", "that" · Sets reminders
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;