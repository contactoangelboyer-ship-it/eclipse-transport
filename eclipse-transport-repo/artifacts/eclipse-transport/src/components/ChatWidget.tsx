import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type Message = {
  id: string;
  type: "user" | "agent";
  text: string | React.ReactNode;
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "agent",
      text: "Hello! How can we assist you with your transportation needs today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), type: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    // Simulate thinking
    setTimeout(() => {
      let responseText: string | React.ReactNode = "";
      const lower = text.toLowerCase();

      if (lower.includes("book") || lower.includes("reserve")) {
        responseText = (
          <>
            I'd love to help you book! You can reserve online at our booking page, or call us at (626) 977-4721. Want me to take you there?{" "}
            <Link href="/book" className="underline font-semibold block mt-2">
              Book Now →
            </Link>
          </>
        );
      } else if (
        lower.includes("price") ||
        lower.includes("quote") ||
        lower.includes("cost") ||
        lower.includes("rate")
      ) {
        responseText =
          "Our rates start from $95/hr for SUVs and $75/hr for sedans. Airport transfers from $150. For a custom quote, call (626) 977-4721 or submit the booking form.";
      } else if (lower.includes("airport") || lower.includes("lax")) {
        responseText =
          "We provide LAX, BUR, LGB, SNA, and ONT airport transfers 24/7. We monitor your flight for delays. Book online or call us!";
      } else if (lower.includes("availability") || lower.includes("available")) {
        responseText =
          "We operate 24/7 in Greater Los Angeles. For same-day bookings, please call (626) 977-4721 directly.";
      } else if (lower.includes("corporate") || lower.includes("business")) {
        responseText =
          "We offer corporate accounts with monthly billing, dedicated vehicles, and priority dispatch. Contact us at Eclipsetransport995@gmail.com.";
      } else {
        responseText =
          "Thank you for your message! For the fastest response, call us at (626) 977-4721 or email Eclipsetransport995@gmail.com. We're available 24/7.";
      }

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), type: "agent", text: responseText },
      ]);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#1A1A1A] text-white px-5 py-4 rounded-full shadow-lg hover:bg-black transition-all hover:scale-105 active:scale-95 relative"
            data-testid="button-open-chat"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-semibold text-sm">Chat</span>
            {hasUnread && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#FCFBF8] rounded-full translate-x-0 -translate-y-0"></span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 right-0 w-[380px] h-[520px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-black/5"
          >
            {/* Header */}
            <div className="bg-[#1A1A1A] text-white p-4 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-widest">Eclipse</h3>
                <div className="flex items-center gap-2 text-xs text-white/70 mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Support • Online
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                data-testid="button-close-chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FCFBF8]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.type === "user"
                        ? "bg-[#1A1A1A] text-white rounded-br-sm"
                        : "bg-white border border-black/5 text-[#1A1A1A] rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length === 1 && (
              <div className="p-3 bg-[#FCFBF8] border-t border-black/5 flex flex-wrap gap-2 shrink-0">
                {["Book a Ride", "Get a Quote", "Check Availability", "Talk to Dispatch"].map(
                  (btn) => (
                    <button
                      key={btn}
                      onClick={() => handleSend(btn)}
                      className="text-xs border border-black/10 bg-white px-3 py-1.5 rounded-full text-[#1A1A1A] hover:bg-black/5 transition-colors"
                    >
                      {btn}
                    </button>
                  )
                )}
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-black/5 flex gap-2 items-center shrink-0">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend(inputValue)}
                placeholder="Type your message..."
                className="flex-1 text-sm outline-none px-3 py-2 bg-transparent"
                data-testid="input-chat"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim()}
                className="h-8 w-8 rounded-full bg-[#1A1A1A] text-white hover:bg-black hover:text-white"
                data-testid="button-send-chat"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
