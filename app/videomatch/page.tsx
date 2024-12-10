"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/client/socket/context/Socketcontext";
import { useRouter } from "next/navigation";
import { SocketUser } from "@/backend/types";

const motivationalQuotes = [
  "คุณกำลังจะได้พบเพื่อนใหม่!",
  "การพบปะครั้งใหม่ อาจเปลี่ยนชีวิตคุณ.",
  "การรอคอย คือการสร้างสิ่งที่ยิ่งใหญ่!",
];

export default function Videomatch() {
  const { socket } = useSocket();
  const router = useRouter();
  const [quote, setQuote] = useState(motivationalQuotes[0]);

  useEffect(() => {
    if (socket) {
      socket.on("videoMatched", ({ peerUser, roomId }: { peerUser: SocketUser, roomId: string }) => {
        console.log("Matched with user:", peerUser);
        console.log("Room ID:", roomId);
        router.push(`/videopeer/${roomId}`);
      });

      return () => {
        socket.off("videoMatched");
      };
    }
  }, [socket, router]);

  useEffect(() => {
    // เปลี่ยนข้อความสุ่มทุก 5 วินาที
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
      setQuote(motivationalQuotes[randomIndex]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent opacity-10 animate-gradientMove"></div>

      {/* Header */}
      <h1 className="text-3xl font-bold mb-6 text-center animate-pulse">
        กำลังสุ่ม Video Match
      </h1>

      {/* Animated Spinner */}
      <div className="relative">
        <div className="animate-spinSlow rounded-full h-40 w-40 border-t-4 border-primary"></div>
        <div className="absolute inset-0 flex items-center justify-center animate-bounce">
          <span className="text-5xl font-semibold text-primary">🎥</span>
        </div>
      </div>

      {/* Motivational Quote */}
      <p className="mt-6 text-lg text-muted-foreground text-center italic">
        {quote}
      </p>

      {/* Additional Text */}
      <p className="mt-2 text-sm text-muted-foreground text-center">
        โปรดรอสักครู่... คุณกำลังจะได้พบคนพิเศษ!
      </p>
    </div>
  );
}
