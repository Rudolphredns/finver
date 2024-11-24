"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/Socketcontext";

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
      socket.emit("matchVideo", { userId: user.id });
      router.push("/videomatch");
    }
  };

  const handleMatchChat = () => {
    if (socket && user) {
      socket.emit("matchChat", { userId: user.id });
    }
  };

  const handleSignIn = () => {
    router.push("/sign-in");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#343434] relative overflow-hidden">
      {/* Background Animations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-[#FC924B] rounded-full opacity-10 blur-3xl top-20 left-20 animate-pulse"></div>
        <div className="absolute w-[400px] h-[400px] bg-[#282828] rounded-full opacity-20 blur-2xl bottom-20 right-20 animate-pulse"></div>
      </div>

      {/* Main Content */}
      {isInitialLoad ? (
        <div className="flex items-center justify-center relative z-10">
          <h2 className="text-3xl text-white animate-pulse">Loading...</h2>
        </div>
      ) : (
        <div className="bg-[#282828] p-12 rounded-3xl shadow-2xl max-w-4xl w-full text-center text-white relative z-10">
          {isSignedIn ? (
            <div>
              <h1 className="text-6xl font-extrabold text-[#FC924B] mb-8 animate-fadeInUp">
                Welcome Back!
              </h1>
              <p className="text-2xl text-gray-300 mb-4 animate-fadeInUp delay-100">
                Currently, we have over{" "}
                <span className="font-bold text-[#FC924B]">100 accounts</span>{" "}
                on our platform!
              </p>
              <p className="text-lg mb-10 text-gray-300 leading-relaxed animate-fadeInUp delay-200">
                Ready to meet new people? Choose how you want to connect and
                start creating unforgettable moments.
              </p>

              {/* Match Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 animate-fadeInUp delay-400">
                <div className="p-8 bg-[#FC924B] rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-transform">
                  <h2 className="text-3xl font-bold mb-4 text-white">
                    Match Video
                  </h2>
                  <p className="text-lg text-gray-100 mb-6">
                    Connect face-to-face with interesting people worldwide.
                  </p>
                  <button
                    onClick={handleMatchVideo}
                    className="w-full py-3 text-white font-semibold rounded-lg bg-[#D97940] hover:bg-[#B96A34] transition-all"
                  >
                    Start Video Chat
                  </button>
                </div>
                <div className="p-8 bg-[#6C757D] rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-transform">
                  <h2 className="text-3xl font-bold mb-4 text-white">
                    Match Chat
                  </h2>
                  <p className="text-lg text-gray-200 mb-6">
                    Engage in fun and meaningful text conversations.
                  </p>
                  <button
                    onClick={handleMatchChat}
                    className="w-full py-3 text-white font-semibold rounded-lg bg-[#555B61] hover:bg-[#3D4246] transition-all"
                  >
                    Start Text Chat
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-7xl font-extrabold text-[#FC924B] mb-6 animate-fadeInUp">
                Finver
              </h1>
              <p className="text-2xl mb-8 text-gray-300 leading-relaxed animate-fadeInUp delay-200">
                Join the world of endless connections. Discover friends, share
                stories, and create moments that last forever.
              </p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleSignIn}
                  className="px-8 py-4 bg-[#FC924B] text-white font-bold rounded-lg shadow-lg hover:shadow-2xl hover:scale-105 transition-transform text-xl"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
