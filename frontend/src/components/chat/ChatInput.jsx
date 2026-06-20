import { useState } from "react";
import { SendHorizonal } from "lucide-react";

function ChatInput({ disabled = false, loading = false, onSend }) {
  const [text, setText] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanText = text.trim();

    if (!cleanText) return;

    onSend(cleanText);
    setText("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-[#EEF0F6] bg-white p-4"
    >
      <div className="flex items-end gap-3">
        <textarea
          value={text}
          disabled={disabled || loading}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit(event);
            }
          }}
          rows={1}
          maxLength={1000}
          placeholder="Type your message..."
          className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold leading-6 text-[#111827] outline-none transition focus:border-[#9381FF] focus:ring-4 focus:ring-[#9381FF]/10 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={disabled || loading || !text.trim()}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#9381FF] text-white shadow-[0_14px_28px_rgba(147,129,255,0.24)] transition hover:bg-[#7E6EF2] disabled:cursor-not-allowed disabled:bg-[#C4BFFF] disabled:shadow-none"
        >
          <SendHorizonal size={19} />
        </button>
      </div>

      <p className="mt-2 text-right text-[11px] font-bold text-[#9CA3AF]">
        {text.length}/1000
      </p>
    </form>
  );
}

export default ChatInput;