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
  const [reason, setReason] = useState<string>("");
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);  // เปิด/ปิด Modal
  const senderUsername = user?.username || "Anonymous";  // ใช้ "Anonymous" ถ้าไม่มี username

  const reportReasons = ["พฤติกรรมไม่เหมาะสม", "การกระทำผิดกฎ", "การข่มขู่หรือคุกคาม"]; // เหตุผลที่ใช้ในการรีพอร์ต

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
        alert("ห้องของคุณถูกยุบ");

        setTimeout(() => {
          router.push("/");  
        }, 1000);
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

  // ฟังก์ชันในการรีพอร์ต
  const handleReport = () => {
    if (reason.trim() === "") {
      alert("กรุณาเลือกเหตุผลในการรีพอร์ต");
      return;
    }

    const reportData = {
      reported_user_id: "ID ของผู้ถูกรีพอร์ต", // ใช้ ID ของผู้ถูกรีพอร์ต
      reporting_user_id: user?.id, // ใช้ user id ของผู้รีพอร์ต
      reason: reason,
      description: "รายละเอียดเพิ่มเติม (ถ้ามี)",
    };

    if (socket) {
      socket.emit("reportUser", reportData, (response: { success: boolean, message: string }) => {
        if (response.success) {
          alert("รายงานสำเร็จ!");
          setReportModalOpen(false); // ปิด modal หลังจากรายงานเสร็จ
        } else {
          alert("ไม่สามารถทำการรีพอร์ตได้");
        }
      });
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
      <button onClick={handleLeaveRoom} className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md">
        ออกจากห้อง
      </button>

      {/* ปุ่มรีพอร์ต */}
      <button
        onClick={() => setReportModalOpen(true)}
        className="mt-4 bg-yellow-500 text-white px-4 py-2 rounded-md"
      >
        รีพอร์ตผู้ใช้
      </button>

      {/* Modal สำหรับเลือกเหตุผลในการรีพอร์ต */}
      {reportModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">เลือกเหตุผลในการรีพอร์ต</h2>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
            >
              <option value="">เลือกเหตุผล</option>
              {reportReasons.map((reasonOption, index) => (
                <option key={index} value={reasonOption}>
                  {reasonOption}
                </option>
              ))}
            </select>
            <button
              onClick={handleReport}
              className="bg-blue-500 text-white px-4 py-2 rounded-md w-full"
            >
              ส่งรายงาน
            </button>
            <button
              onClick={() => setReportModalOpen(false)}
              className="mt-2 text-gray-500"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
