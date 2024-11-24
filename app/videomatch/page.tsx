"use client";

import { useEffect } from "react";
import { useSocket } from "@/context/Socketcontext";
import { useRouter } from "next/navigation";
import { SocketUser } from "@/types";

export default function Videomatch() {
  const { socket } = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (!socket) {
      console.warn("Socket not initialized!");
      return;
    }

    if (!socket.connected) {
      console.warn("Socket not connected!");
      return;
    }

    // ฟัง event เมื่อมีการจับคู่สำเร็จ
    const handleVideoMatched = ({ peerUser, roomId }: { peerUser: SocketUser; roomId: string }) => {
      console.log("Matched with user:", peerUser);
      console.log("Room ID:", roomId);

      // เปลี่ยนเส้นทางไปที่ /videopeer/[roomId] เมื่อจับคู่สำเร็จ
      router.push(`/videopeer/${roomId}`);
    };

    socket.on("videoMatched", handleVideoMatched);

    // ลบ event listener เมื่อ component ถูกยกเลิก
    return () => {
      socket.off("videoMatched", handleVideoMatched);
    };
  }, [socket, router]);

  useEffect(() => {
    // เพิ่ม timeout กรณีไม่มีการจับคู่
    const timeout = setTimeout(() => {
      console.warn("No match found within the timeout period.");
    }, 30000); // 30 seconds timeout

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">กำลังรอสุ่ม video กับคนอื่น...</h1>
      <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-500 border-opacity-75"></div>
      <p className="mt-4 text-gray-600">โปรดรอซักครู่...</p>
    </div>
  );
}
