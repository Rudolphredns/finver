// src/pages/index.jsx
"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useSocket } from "@/client/socket/context/Socketcontext";
import ListOnlineUser from "@/components/ListOnlineUser";
import { FaVideo } from "react-icons/fa";
import { MdChat } from "react-icons/md";
import { HiShieldCheck } from "react-icons/hi";

export default function Home() {
  const [status, setStatus] = useState("");
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const { socket, isSocketConnected } = useSocket();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      setIsInitialLoad(false);
    }

    if (isLoaded && !isSignedIn) {
      return;
    }

    if (isLoaded && isSignedIn && isSocketConnected) {
      socket?.on("status", (message) => {
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
      router.push("/chatmatch");
    }
  };

  const handleSignIn = () => {
    router.push("/sign-in");
  };

  const handleSignUp = () => {
    router.push("/sign-up");
  };

  useEffect(() => {
    if (socket) {
      socket.on("redirectTo", (path) => {
        console.log(`Redirecting to: ${path}`);
        router.push(path);
      });
    }

    return () => {
      if (socket) {
        socket.off("redirectTo");
      }
    };
  }, [socket, router]);

  return (
    <div className="bg-background text-foreground font-sans relative">
      {isInitialLoad ? (
        <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
          <h2 className="text-3xl animate-pulse">Loading...</h2>
        </div>
      ) : isSignedIn ? (
        <div className="min-h-screen flex flex-col items-center bg-background text-foreground px-4 py-8">
          <h1 className="text-4xl font-bold mb-4 text-center">Welcome to Finver</h1>
          <p className="text-lg mb-6 text-center">{status}</p>
          <ListOnlineUser />
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleMatchVideo}
              className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all duration-300 transform hover:scale-105"
            >
              Match Video
            </button>
            <button
              onClick={handleMatchChat}
              className="px-6 py-2 bg-secondarys text-secondary-foreground font-semibold rounded-lg shadow-md hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50 transition-all duration-300 transform hover:scale-105"
            >
              Match Chat
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 py-8 space-y-12">
          {/* Hero Section */}
          <section className="w-full max-w-4xl text-center">
            <div className="w-full h-64 md:h-96 bg-background rounded-lg shadow-lg flex flex-col items-center justify-center relative">
              <div className="relative z-10 px-4">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-foreground drop-shadow-lg">
                  Welcome to Finver
                </h1>
                <p className="text-md md:text-lg mb-6 text-foreground drop-shadow-lg">
                  Finver is your go-to app for finding meaningful connections online. Randomly connect with new people via video and engage in real-time chat to build lasting relationships.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={handleSignIn}
                    className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-lg shadow-lg hover:bg-primary-dark hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-lg"
                  >
                    Sign In
                  </button>
                  {/* ปุ่ม Sign Up ยังใช้ secondary ได้ */}
                  <button
                    onClick={handleSignUp}
                    className="px-8 py-3 bg-sky-600 text-secondary-foreground font-bold rounded-lg shadow-lg hover:bg-secondary-dark hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-lg"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="w-full max-w-4xl px-4">
            <h2 className="text-3xl font-semibold mb-6 text-center">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-lg shadow-inner flex flex-col items-center hover:bg-card-dark transition-colors duration-300">
                <FaVideo className="text-primary mb-4" size={40} />
                <h3 className="text-xl font-bold mb-2 text-center">
                  Random Video Connections
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  Connect with new people through random video calls. Experience spontaneous and genuine interactions.
                </p>
              </div>
              {/* เปลี่ยน text-secondary ของ MdChat เป็นสีอื่น เช่น text-primary */}
              <div className="bg-card p-6 rounded-lg shadow-inner flex flex-col items-center hover:bg-card-dark transition-colors duration-300">
                <MdChat className="text-primary mb-4" size={40} />
                <h3 className="text-xl font-bold mb-2 text-center">Real-time Chat</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Engage in meaningful conversations with our integrated chat system. Share your thoughts instantly.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-inner flex flex-col items-center hover:bg-card-dark transition-colors duration-300">
                <HiShieldCheck className="text-accent mb-4" size={40} />
                <h3 className="text-xl font-bold mb-2 text-center">Secure & Private</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Your privacy is our priority. Enjoy secure connections and protect your personal information.
                </p>
              </div>
            </div>
          </section>

          {/* Statistics Section */}
          <section className="w-full max-w-4xl">
            <h2 className="text-3xl font-semibold mb-6 text-center">
              Join Our Growing Community
            </h2>
            <div className="flex flex-col md:flex-row justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold">10,000+</p>
                <p className="text-sm text-muted-foreground">Registered Users</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">5,000+</p>
                <p className="text-sm text-muted-foreground">Active Connections</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">4.8/5</p>
                <p className="text-sm text-muted-foreground">User Ratings</p>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="w-full max-w-4xl">
            <h2 className="text-3xl font-semibold mb-6 text-center">What Our Users Say</h2>
            <div className="space-y-6">
              <div className="bg-card p-6 rounded-lg shadow-inner hover:bg-card-dark transition-colors duration-300 flex flex-col md:flex-row items-center">
                <img
                  src="/images/jane-doe.jpg"
                  alt="Jane Doe"
                  className="w-16 h-16 rounded-full mr-4 object-cover"
                />
                <div>
                  <p className="text-sm italic">
                    "Finver has completely changed the way I meet new people. The video matching
                    feature is seamless and the chat system is fantastic!"
                  </p>
                  <p className="text-right text-xs mt-2">- Jane Doe</p>
                </div>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-inner hover:bg-card-dark transition-colors duration-300 flex flex-col md:flex-row items-center">
                <img
                  src="/images/john-smith.jpg"
                  alt="John Smith"
                  className="w-16 h-16 rounded-full mr-4 object-cover"
                />
                <div>
                  <p className="text-sm italic">
                    "I love how Finver connects me with genuine people. The user interface is clean
                    and easy to navigate."
                  </p>
                  <p className="text-right text-xs mt-2">- John Smith</p>
                </div>
              </div>
            </div>
          </section>

          {/* Call-to-Action Section */}
          <section className="w-full max-w-4xl text-center">
            <h2 className="text-3xl font-semibold mb-6">Ready to Find Your Match?</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={handleSignIn}
                className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-lg shadow-lg hover:bg-primary-dark hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-lg"
              >
                Sign In
              </button>
              {/* ปุ่ม Sign Up ยังใช้ secondary ได้อยู่ */}
              <button
                onClick={handleSignUp}
                className="px-8 py-3 bg-secondarys text-secondary-foreground font-bold rounded-lg shadow-lg hover:bg-secondary-dark hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-lg"
              >
                Sign Up
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
