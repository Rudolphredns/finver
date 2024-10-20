"use client";
import { useEffect, useState } from "react";
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useSocket } from "@/context/Socketcontext";
import ListOnlineUser from "@/components/ListOnlineUser";

export default function Home() {
  const [status, setStatus] = useState<string>("");
  const { isLoaded, isSignedIn, user } = useUser(); // ใช้ useUser() เพื่อดึงข้อมูลผู้ใช้
  const router = useRouter();
  const { socket, isSocketConnected } = useSocket(); // ใช้ socket จาก context

  useEffect(() => {
    // Check if the user is authenticated
    if (isLoaded && !isSignedIn) {
      // Redirect to login page if the user is not signed in
      router.push('/sign-in');
      return;
    }

    // Set up socket listener if user is signed in and socket is connected
    if (isLoaded && isSignedIn && isSocketConnected) {
      socket?.on("status", (message: string) => {
        setStatus(message);
      });
    }

    // Clean up the socket listener when the component is unmounted
    return () => {
      socket?.off("status");
    };
  }, [isLoaded, isSignedIn, router, socket, isSocketConnected]);

  // ฟังก์ชันสำหรับ match video call
  const handleMatchVideo = () => {
    if (socket && user) {
      socket.emit('matchVideo', { userId: user.id });
      router.push('/videomatch'); 
    }
  };

  // ฟังก์ชันสำหรับ match chat
  const handleMatchChat = () => {
    if (socket && user) {
      socket.emit('matchChat', { userId: user.id });
    }
  };

  return (
    <div>
      <h1>Welcome to the Chat App</h1>
      <p>{status}</p>
      <ListOnlineUser />

      {/* ปุ่มสำหรับ Match Video และ Match Chat */}
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={handleMatchVideo}
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-all"
        >
          Match Video
        </button>
        <button
          onClick={handleMatchChat}
          className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition-all"
        >
          Match Chat
        </button>
      </div>
    </div>
  );
}
