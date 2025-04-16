import React, {useState, useRef, useEffect} from "react";
import axios from "axios";

export default function AIConvoApp() {
    const [topic, setTopic] = useState("");
    const [pollingInterval, setPollingInterval] = useState(null);
    const [conversation, setConversation] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef(null);

    // Auto-scroll when conversation updates
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [conversation]);

    // Color-code lines by model
    const parseConvo = (convString) => {
        const lines = convString.split("\n").filter(Boolean);

        return lines.map((line, i) => {
            const colonIndex = line.indexOf(":");
            if (colonIndex === -1) return null;

            const senderRaw = line.substring(0, colonIndex);
            const sender = senderRaw.trimEnd(); // remove trailing whitespace
            console.log("DEBUG:", sender, [...sender].map(c => c.charCodeAt(0)));
            const content = line.substring(colonIndex + 1).trim();

            const colorMap = {
                "GPT": "text-red-500",
                "Gemini": "text-blue-500",
                "DeepSeek": "text-purple-500",
            };
            // Default color for unknown LLM
            const color = colorMap[sender] || "text-grey-600";

            return (
                <div
                    key={i}
                    className="bg-gray-200 rounded-xl px-4 py-3 mb-3 shadow-sm text-left"
                >
                    <span className={`font-bold ${color}`}>{sender}:</span>{" "}
                    <span className="text-gray-900">{content}</span>
                </div>
            );
        });
    };

    const startConversation = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        setConversation("");
        // Clear existing polling if any
        if (pollingInterval) clearInterval(pollingInterval);

        try {
            const res = await axios.post("http://ec2-44-204-194-61.compute-1.amazonaws.com:8000/start-convo", {
                topic,
            });
            const convoId = res.data.convo_id;

            // Poll every 3s
            const interval = setInterval(async () => {
                try {
                    const logRes = await axios.get(
                        `http://ec2-44-204-194-61.compute-1.amazonaws.com:8000/convo-log/${convoId}`
                    );
                    if (logRes.data.formatted) {
                        setConversation(logRes.data.formatted);
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            }, 3000);

            setPollingInterval(interval);
        } catch (err) {
            console.error("Start convo error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const clearConversation = () => {
        if (pollingInterval) clearInterval(pollingInterval);
        setTopic("");
        setConversation("");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow p-6">
                {/* Big header + icon */}
                <h1 className="text-4xl font-bold mb-6 flex items-center">
          <span role="img" aria-label="robot" className="mr-3 text-5xl">
            🤖
          </span>
                    AI Roundtable
                </h1>

                {/* Topic label + input */}
                <div className="mb-4">
                    <label className="block font-semibold mb-1 text-gray-700">
                        Enter a discussion topic:
                    </label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="What should they discuss?"
                    />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mb-4">
                    <button
                        onClick={startConversation}
                        disabled={isLoading || !topic.trim()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 disabled:opacity-50"
                    >
                        Chat
                    </button>
                    <button
                        onClick={clearConversation}
                        className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700"
                    >
                        Clear
                    </button>
                </div>

                {/* Chat window */}
                <div
                    ref={chatContainerRef}
                    className="relative w-full p-4 border-4 border-blue-300 rounded-md
                     shadow-lg overflow-y-scroll h-[400px] bg-gray-900 text-left"
                    style={{boxShadow: "0 0 20px rgba(0, 127, 255, 0.5)"}}
                >
                    {conversation ? (
                        parseConvo(conversation)
                    ) : (
                        <div className="text-gray-400 italic">
                            Conversation will appear here...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}