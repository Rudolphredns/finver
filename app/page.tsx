"use client";
import { useEffect, useState } from "react";
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useSocket } from "@/context/Socketcontext";
import ListOnlineUser from "@/components/ListOnlineUser";

export default function Home() {
  const [status, setStatus] = useState<string>("");
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const { socket, isSocketConnected } = useSocket();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      setIsInitialLoad(false);
    }

    if (isLoaded && isSignedIn && isSocketConnected) {
      socket?.on("status", (message: string) => {
        setStatus(message);
      });
    }

    return () => {
      socket?.off("status");
    };
  }, [isLoaded, isSignedIn, router, socket, isSocketConnected]);

  const handleMatchVideo = () => {
    if (socket && user) {
      socket.emit('matchVideo', { userId: user.id });
      router.push('/videomatch');
    }
  };

  const handleMatchChat = () => {
    if (socket && user) {
      socket.emit('matchChat', { userId: user.id });
    }
  };

  const handleSignIn = () => {
    router.push('/sign-in');
  };

  const handleSignUp = () => {
    router.push('/sign-up');
  };

  return (
    <div className="min-h-screen flex items-center justify-start px-4 py-8 relative" style={{ backgroundColor: "#343434" }}>
      {isInitialLoad ? (
        <div className="flex items-center justify-center relative z-10">
          <h2 className="text-xl text-white">Loading...</h2>
        </div>
      ) : (
        <div className="bg-[#00000] p-6 rounded-lg shadow-lg max-w-lg w-full relative z-10">
          <h1 className="text-1xl font-semibold text-start text-[#FC924B] mb-4">
            Find New Friends
          </h1>
          <h1 className="text-5xl font-semibold text-start text-[white] mb-4">
            Finver
          </h1>
          <h1 className="text-1xl font-semibold text-start text-[white] mb-4">
          Finver is a program that will help you meet new people around the world and 
          let you talk to them. 
          You can also create your 
          own profile as you want. You can also see each other's faces through video chat and text messages.
          </h1>
          <p className="text-white text-[#34495e] mb-4">{status}</p>
          {/* <ListOnlineUser /> */}

          {/* Only show Sign In/Sign Up buttons if not signed in */}
          {!isSignedIn && (
            <div className="flex flex-col gap-4 mt-6">
              <button
                onClick={handleSignIn}
                className="w-full px-2 py-2 bg-[#FC924B] text-white font-semibold rounded-lg shadow-md hover:bg-[#8e44ad] transition-all"
              >
                Let's Starts
              </button>
            </div>
          )}

          {/* Only show Match Video/Chat buttons if signed in */}
          {isSignedIn && (
            <div className="flex flex-col gap-4 mt-6">
              <button
                onClick={handleMatchVideo}
                className="w-full px-4 py-2 bg-[#9b59b6] text-white font-semibold rounded-lg shadow-md hover:bg-[#8e44ad] transition-all"
              >
                Match Video
              </button>
              <button
                onClick={handleMatchChat}
                className="w-full px-4 py-2 bg-[#3498db] text-white font-semibold rounded-lg shadow-md hover:bg-[#2980b9] transition-all"
              >
                Match Chat
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
