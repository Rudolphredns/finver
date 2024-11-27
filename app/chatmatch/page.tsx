"use client";

import { useEffect } from "react";
import { useSocket } from "@/context/Socketcontext";
import { useRouter } from "next/navigation";
import { SocketUser } from "@/types";

export default function Chatmatch() {
  const { socket } = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (socket) {
      // ฟัง event เมื่อมีการจับคู่แชทสำเร็จ
      socket.on("chatMatched", ({ peerUser, roomId, initiator }: { peerUser: SocketUser, roomId: string, initiator: boolean }) => {
        console.log("Matched with user:", peerUser);
        console.log("Room ID:", roomId);

        // เปลี่ยนเส้นทางไปที่ /chatpeer/[roomId] เมื่อจับคู่แชทสำเร็จ
        router.push(`/chatpeer/${roomId}`);
      });

      // ลบ event listener เมื่อ component ถูกยกเลิก
      return () => {
        socket.off("chatMatched");
      };
    }
  }, [socket, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">กำลังรอจับคู่แชทกับคนอื่น...</h1>
      <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-500 border-opacity-75"></div>
      <p className="mt-4 text-gray-600">โปรดรอซักครู่...</p>
    </div>
  );
}
