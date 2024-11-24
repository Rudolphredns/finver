"use client";

import { useEffect } from "react";
import { useSocket } from "@/context/Socketcontext";
import { useRouter } from "next/navigation";
import { SocketUser } from "@/types";

export default function Videomatch() {
  const { socket } = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (socket) {
      // ฟัง event เมื่อมีการจับคู่สำเร็จ
      socket.on(
        "videoMatched",
        ({ peerUser, roomId }: { peerUser: SocketUser; roomId: string }) => {
          console.log("Matched with user:", peerUser);
          console.log("Room ID:", roomId);

          // เปลี่ยนเส้นทางไปที่ /videopeer/[roomId] เมื่อจับคู่สำเร็จ
          router.push(`/videopeer/${roomId}`);
        }
      );

      // ลบ event listener เมื่อ component ถูกยกเลิก
      return () => {
        socket.off("videoMatched");
      };
    }
  }, [socket, router]);

  const handleCancel = () => {
    if (socket) {
      socket.emit("cancelMatching"); // แจ้งเซิร์ฟเวอร์เพื่อยกเลิกการหาคู่
    }
    router.push("/"); // กลับไปที่หน้า Home
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#343434] relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-[#FC924B] rounded-full opacity-10 blur-3xl top-20 left-20 animate-pulse"></div>
        <div className="absolute w-[400px] h-[400px] bg-[#282828] rounded-full opacity-20 blur-2xl bottom-20 right-20 animate-pulse"></div>
      </div>

      {/* Content */}
      <div className="z-10 text-center">
        <h1 className="text-6xl font-extrabold text-[#FC924B] mb-8 animate-fadeInUp">
          Finding Your Match...
        </h1>
        <div className="relative inline-block">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-[#FC924B]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-semibold text-white animate-pulse">
              Loading
            </span>
          </div>
        </div>
        <p className="mt-6 text-lg text-gray-300 animate-fadeInUp delay-200">
          Please wait while we find the best match for you...
        </p>

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="mt-10 px-8 py-4 bg-[#6C757D] text-white font-bold rounded-lg shadow-lg hover:shadow-2xl hover:bg-[#555B61] transition-all text-xl"
        >
          Cancel Matching
        </button>
      </div>
    </div>
  );
}
