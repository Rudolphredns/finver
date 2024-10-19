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
    // Check if the user is authenticated
    if (isLoaded && !isSignedIn) {
      // Redirect to login page if the user is not signed in
      router.push('/sign-in');
      return;
    }

    // Set up socket listener if user is signed in
    if (isLoaded && isSignedIn) {
      socket.on("status", (message: string) => {
        setStatus(message);
      });
    }

    // Clean up the socket listener when the component is unmounted
    return () => {
      socket.off("status");
    };
  }, [isLoaded, isSignedIn, router]);

  return (
    <div>
      <h1>Welcome to the Chat App</h1>
      <p>{status}</p> 
    </div>
  );
}
