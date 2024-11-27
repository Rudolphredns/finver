"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/context/Socketcontext";
import { useRouter } from "next/navigation";

export default function ChatPeer({ roomId }: { roomId: string }) {
  const { socket } = useSocket();
  const router = useRouter();
  const [messages, setMessages] = useState<Array<{ senderId: string; senderUsername: string; message: string; timestamp: string }>>([]);
  const [newMessage, setNewMessage] = useState<string>("");

  // ฟังการส่งข้อความจากห้อง
  useEffect(() => {
    if (socket) {
        socket.on("receiveMessage", (messageData: { senderId: string; senderUsername: string; message: string; timestamp: string }) => {
            setMessages((prevMessages) => [...prevMessages, messageData]);
        });

        // ลบ event listener เมื่อ component ถูกยกเลิก
        return () => {
            socket.off("receiveMessage");
        };
    }
}, [socket]);


  // ฟังการเข้าไปในห้อง chat
  useEffect(() => {
    if (socket && roomId) {
      socket.emit("joinRoom", roomId);  // ตรวจสอบให้มั่นใจว่า roomId ถูกส่งไปถูกต้อง
    }
  }, [socket, roomId]);

  // ส่งข้อความ
  const handleSendMessage = () => {
    if (newMessage.trim() !== "" && socket) { 
        const messageData = {
                roomId,
                message: newMessage,
                senderId: socket.id,  // หรือ senderId ที่คุณใช้
                senderUsername: "YourUsername",  // หรือชื่อผู้ใช้ที่คุณต้องการใช้
                timestamp: new Date().toISOString()  // เวลาปัจจุบัน
            };

            socket.emit("sendMessage", messageData);  // ส่งข้อมูลนี้ไปที่ server
            setMessages((prevMessages) => [...prevMessages, messageData]);
            setNewMessage("");  // รีเซ็ตข้อความหลังจากส่งแล้ว
        }
    };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-4">ห้องสนทนา</h1>

      {/* แสดงข้อความทั้งหมด */}
      <div className="bg-white p-4 w-full max-w-lg rounded-lg shadow-md overflow-y-auto mb-4" style={{ maxHeight: "400px" }}>
        {messages.map((message, index) => (
          <div key={index} className="text-gray-700 mb-2">
            <div>
              <strong>{message.senderUsername}</strong>: {message.message}
            </div>
            <div className="text-xs text-gray-500">{message.timestamp}</div>
          </div>
        ))}
      </div>

      {/* แป้นพิมพ์ */}
      <div className="w-full max-w-lg flex items-center border-t border-gray-300 pt-4">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-md"
          placeholder="พิมพ์ข้อความ..."
        />
        <button
          onClick={handleSendMessage}
          className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          ส่ง
        </button>
      </div>
    </div>
  );
}
