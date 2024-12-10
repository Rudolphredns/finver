"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/client/socket/context/Socketcontext";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Load Emoji Picker dynamically
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface MessageData {
  roomId: string;
  senderId: string;
  senderUsername: string;
  message: string;
  timestamp: string;
}

export default function ChatPeer() {
  const { socket } = useSocket();
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const roomId = Array.isArray(params?.roomId) ? params.roomId[0] : params?.roomId || undefined;

  const [messages, setMessages] = useState<MessageData[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState<boolean>(false);
  const senderUsername = user?.username || "Anonymous";

  const reportReasons = ["พฤติกรรมไม่เหมาะสม", "การกระทำผิดกฎ", "การข่มขู่หรือคุกคาม"];

  useEffect(() => {
    if (socket) {
      socket.on("receiveMessage", (messageData: MessageData) => {
        setMessages((prevMessages) => [...prevMessages, messageData]);
      });

      return () => {
        socket.off("receiveMessage");
      };
    }
  }, [socket]);

  useEffect(() => {
    if (socket && roomId) {
      socket.emit("joinRoom", roomId);
    }
  }, [socket, roomId]);

  const handleSendMessage = () => {
    if (newMessage.trim() !== "" && roomId && socket) {
      const messageData: MessageData = {
        roomId: roomId,
        message: newMessage,
        senderId: socket.id!,
        senderUsername: senderUsername,
        timestamp: new Date().toISOString(),
      };

      socket.emit("sendMessage", messageData, (response: { success: boolean, message: string }) => {
        if (response.success) {
          console.log("Message sent successfully:", response.message);
        } else {
          console.error("Failed to send message:", response.message);
        }
      });

      setMessages((prevMessages) => [...prevMessages, messageData]);
      setNewMessage("");
    }
  };

  const handleEmojiClick = (emojiObject: any) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
    setEmojiPickerVisible(false); // ซ่อน Emoji Picker หลังเลือก
  };

  const handleLeaveRoom = () => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการออกจากห้อง?")) {
      if (socket && roomId) {
        socket.emit("leaveRoom", roomId);
        console.log(`Left room ${roomId}`);
        router.push("/");
      }
    }
  };

  const handleReport = () => {
    if (reason.trim() === "") {
      alert("กรุณาเลือกเหตุผลในการรีพอร์ต");
      return;
    }

    const reportData = {
      reported_user_id: "ID ของผู้ถูกรีพอร์ต",
      reporting_user_id: user?.id,
      reason: reason,
      description: "รายละเอียดเพิ่มเติม (ถ้ามี)",
    };

    if (socket) {
      socket.emit("reportUser", reportData, (response: { success: boolean, message: string }) => {
        if (response.success) {
          alert("รายงานสำเร็จ!");
          setReportModalOpen(false);
        } else {
          alert("ไม่สามารถทำการรีพอร์ตได้");
        }
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary via-secondary to-accent text-foreground p-4">
      <h1 className="text-3xl font-bold mb-4">ห้องสนทนา</h1>

      {/* กรอบแชท */}
      <div className="bg-card p-4 w-full max-w-2xl h-96 rounded-lg shadow-lg overflow-y-auto mb-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.senderUsername === senderUsername ? "justify-end" : "justify-start"
            } mb-2`}
          >
            <div>
              {message.senderUsername !== senderUsername && (
                <div className="text-xs text-muted-foreground mb-1">{message.senderUsername}</div>
              )}
              <div
                className={`max-w-xs px-3 py-2 rounded-lg shadow ${
                  message.senderUsername === senderUsername
                    ? "bg-primary text-white"
                    : "bg-secondary text-white"
                }`}
              >
                {message.message}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* แป้นพิมพ์ */}
      <div className="w-full max-w-2xl flex items-center space-x-2">
        <button
          onClick={() => setEmojiPickerVisible((prev) => !prev)}
          className="p-2 bg-accent text-white rounded-md hover:bg-accent-dark"
        >
          😊
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-black"
          placeholder="พิมพ์ข้อความ..."
        />
        <button
          onClick={handleSendMessage}
          className="px-6 py-2 bg-accent text-white font-bold rounded-lg shadow hover:bg-accent-dark transition"
        >
          ส่ง
        </button>
      </div>

      {/* Emoji Picker */}
      {emojiPickerVisible && (
        <div className="absolute bottom-24 bg-white p-2 rounded-md shadow-lg z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}

      {/* ปุ่มออกจากห้อง */}
      <button
        onClick={handleLeaveRoom}
        className="mt-4 bg-accent text-white px-4 py-2 rounded-md hover:bg-accent-dark"
      >
        ออกจากห้อง
      </button>

      {/* ปุ่มรีพอร์ต */}
      <button
        onClick={() => setReportModalOpen(true)}
        className="mt-4 bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary-dark"
      >
        รีพอร์ตผู้ใช้
      </button>

      {/* Modal สำหรับเลือกเหตุผลในการรีพอร์ต */}
      {reportModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
          <div className="bg-card p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">เลือกเหตุผลในการรีพอร์ต</h2>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border border-muted rounded-md mb-4 text-gray-700"
            >
              <option value="" className="text-gray-500">เลือกเหตุผล</option>
              {reportReasons.map((reasonOption, index) => (
                <option key={index} value={reasonOption} className="text-gray-700">
                  {reasonOption}
                </option>
              ))}
            </select>
            <button
              onClick={handleReport}
              className="bg-primary text-white px-4 py-2 rounded-md w-full"
            >
              ส่งรายงาน
            </button>
            <button
              onClick={() => setReportModalOpen(false)}
              className="mt-2 text-muted-foreground"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
