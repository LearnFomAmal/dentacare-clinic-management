const formatMessageTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

function ChatMessageBubble({ message, role }) {
  const isOwnMessage = message.senderRole === role;

  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[78%] rounded-3xl px-5 py-3 shadow-sm ${
          isOwnMessage
            ? "rounded-br-md bg-[#9381FF] text-white"
            : "rounded-bl-md bg-white text-[#111827] border border-[#EEF0F6]"
        }`}
      >
        <p className="whitespace-pre-line break-words text-sm font-semibold leading-6">
          {message.text}
        </p>

        <div
          className={`mt-2 flex items-center justify-end gap-2 text-[11px] font-bold ${
            isOwnMessage ? "text-white/75" : "text-[#9CA3AF]"
          }`}
        >
          <span>{formatMessageTime(message.createdAt)}</span>

          {isOwnMessage && (
            <span>{message.isRead ? "Read" : "Sent"}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatMessageBubble;