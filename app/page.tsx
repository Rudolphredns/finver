"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { io } from 'socket.io-client';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

const socket = io("http://localhost:3000");

export default function Home() {
  const [status, setStatus] = useState<string>("");
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    //ยืนยันตัวตน
    if (isLoaded && !isSignedIn) {
      //กลับไปหน้าล็อคอิน (ทำแบบนี้เพราะบางครั้ง manual direct )
      router.push('/sign-in');
      return;
    }

    // ให้ socket รับคำสั่งเอา
    if (isLoaded && isSignedIn) {
      socket.on("status", (message: string) => {
        setStatus(message);
      });
    }


    return () => {
      socket.off("status");
    };
  }, [isLoaded, isSignedIn, router]);

  // Handlers for the buttons
  const handleMatchVideo = () => {
    console.log("Match Video button clicked");
    // Add your logic for video matching here
  };

  const handleMatchChat = () => {
    console.log("Match Chat button clicked");
    // Add your logic for chat matching here
  };

  return (
    <div>
      <h1>Welcome to the Chat App</h1>
      <p>{status}</p>
      <div>
        <button onClick={handleMatchVideo} style={{ margin: '10px', padding: '10px' }}>Match Video</button>
        <button onClick={handleMatchChat} style={{ margin: '10px', padding: '10px' }}>Match Chat</button>
      </div>
    </div>
  );
}
