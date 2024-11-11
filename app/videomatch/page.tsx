"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/context/Socketcontext";
import { useRouter } from "next/navigation";
import { SocketUser } from "@/types";

export default function Videomatch() {
  const { socket } = useSocket();
  const router = useRouter();
  const [waitingTime, setWaitingTime] = useState(0); // State สำหรับเก็บเวลาที่รอในหน่วยวินาที

  useEffect(() => {
    // เริ่มนับเวลา
    const timer = setInterval(() => {
      setWaitingTime((prevTime) => prevTime + 1);
    }, 1000); // เพิ่มเวลาทุก ๆ 1 วินาที

    // Clear timer เมื่อ component ถูกยกเลิก
    return () => clearInterval(timer);
  }, []);

  // ตรวจสอบว่าเมื่อครบ 30 วินาทีแล้วให้ย้อนกลับไปหน้า /main
  useEffect(() => {
    if (waitingTime === 10) {
      router.push("/");
    }
  }, [waitingTime, router]);

  useEffect(() => {
    if (socket) {
      // ฟัง event เมื่อมีการจับคู่สำเร็จ
      socket.on("videoMatched", ({ peerUser, roomId }: { peerUser: SocketUser, roomId: string }) => {
        console.log("Matched with user:", peerUser);
        console.log("Room ID:", roomId);

        // เปลี่ยนเส้นทางไปที่ /videopeer/[roomId] เมื่อจับคู่สำเร็จ
        router.push(`/videopeer/${roomId}`);
      });

      // ลบ event listener เมื่อ component ถูกยกเลิก
      return () => {
        socket.off("videoMatched");
      };
    }
  }, [socket, router]);

  // คำนวณเวลาในรูปแบบ นาทีและวินาที
  const minutes = Math.floor(waitingTime / 60);
  const seconds = waitingTime % 60;
  const displayTime = minutes > 0 ? `${minutes} นาที ${seconds} วินาที` : `${seconds} วินาที`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">กำลังรอสุ่ม video กับคนอื่น...</h1>
      <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-500 border-opacity-75"></div>
      <p className="mt-4 text-gray-600">โปรดรอซักครู่...</p>
      <p className="mt-2 text-gray-600">รอมาแล้ว {displayTime}</p> {/* แสดงเวลาที่รอในรูปแบบนาทีและวินาที */}
    </div>
  );
}
