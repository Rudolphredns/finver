"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/client/socket/context/Socketcontext";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";

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

  const senderUsername = user?.username || "Anonymous";  // ใช้ "Anonymous" ถ้าไม่มี username

  // ฟังการส่งข้อความจากห้อง
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

  // ฟังการเข้าไปในห้อง chat
  useEffect(() => {
    if (socket && roomId) {
      socket.emit("joinRoom", roomId); 
    }
  }, [socket, roomId]);

  // ฟังเหตุการณ์ออกจากห้อง
  useEffect(() => {
    if (socket) {
      socket.on("leaveRoom", (roomId) => {
        console.log(`You have been removed from room ${roomId}`);
        socket.emit("leaveRoom", roomId);
        // ออกจากห้องแล้ว, รีไดเรกไปที่หน้า main
        router.push("/"); // กำหนดให้ redirect ไปหน้า main page
      });

      return () => {
        socket.off("leaveRoom");
      };
    }
  }, [socket, router]);

  // ฟังเหตุการณ์ห้องถูกยุบ
  useEffect(() => {
    if (socket) {
      socket.on("roomClosed", () => {
        // แสดง alert ให้ผู้ใช้ทราบว่าห้องถูกยุบ
        alert("ห้องของคุณถูกยุบ");

        // รอให้ผู้ใช้เห็นข้อความ alert แล้วค่อยทำการ redirect
        setTimeout(() => {
          router.push("/");  // รีไดเรกไปหน้าแรก
        }, 1000); // ใช้เวลา 1 วินาทีหลังจากปิด alert เพื่อให้ผู้ใช้เห็นข้อความ
      });

      return () => {
        socket.off("roomClosed");
      };
    }
  }, [socket, router]);

  // ส่งข้อความ
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
          console.log('Message sent successfully:', response.message);
        } else {
          console.error('Failed to send message:', response.message);
        }
      });

      setMessages((prevMessages) => [...prevMessages, messageData]);
      setNewMessage("");  // ล้างข้อความใน input
    }
  };

  // ฟังก์ชันในการออกจากห้อง
  const handleLeaveRoom = () => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการออกจากห้อง?")) {
      if (socket && roomId) {
        socket.emit("leaveRoom", roomId);
        console.log(`Left room ${roomId}`);
        router.push("/");  // กำหนดให้ redirect ไปหน้า main page
      }
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
        <button onClick={handleSendMessage} className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-md">
          ส่ง
        </button>
      </div>

      {/* ปุ่มออกจากห้อง */}
      <button 
        onClick={handleLeaveRoom} 
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md">
        ออกจากห้อง
      </button>
    </div>
  );
}
