"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/context/Socketcontext";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

export default function VideoPeer() {
  const { socket } = useSocket();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const [notifications, setNotifications] = useState<string[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [peerName, setPeerName] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  useEffect(() => {
    if (!socket) {
      addNotification("Connection error. Please try rejoining.");
      return;
    }

    let localStream: MediaStream;
    let peerConnection: RTCPeerConnection;

    const config = {
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    };

    const addNotification = (message: string) => {
      setNotifications((prev) => [...prev, message]);
    };

    const createPeerConnection = () => {
      peerConnection = new RTCPeerConnection(config);

      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("sendIceCandidate", { candidate: event.candidate });
        }
      };
    };

    const startConnection = async () => {
      try {
        createPeerConnection();

        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        localStream.getTracks().forEach((track) => {
          if (peerConnection.signalingState !== "closed") {
            peerConnection.addTrack(track, localStream);
          }
        });
      } catch (error) {
        addNotification("Failed to access camera and microphone. Please check your settings.");
      }
    };

    startConnection();

    socket.on("peerLeftRoom", () => {
      addNotification("Your peer has left the room.");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    });

    socket.on("peerUserInfo", (data: { name: string }) => {
      setPeerName(data.name || "Anonymous User");
    });

    socket.on("receiveMessage", (message: string) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("peerLeftRoom");
      socket.off("peerUserInfo");
      socket.off("receiveMessage");

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, [socket, router]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      socket.emit("sendMessage", newMessage);
      setMessages((prev) => [...prev, `You: ${newMessage}`]);
      setNewMessage("");
    }
  };

  const toggleMic = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const handleLeaveRoom = () => {
    setShowLeaveConfirm(true);
  };

  const confirmLeaveRoom = () => {
    setShowLeaveConfirm(false);
    router.push("/");
  };

  const cancelLeaveRoom = () => {
    setShowLeaveConfirm(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-[#343434] relative overflow-hidden">
      {/* Background Animations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] bg-[#FC924B] rounded-full opacity-10 blur-3xl top-20 left-20 animate-pulse"></div>
        <div className="absolute w-[500px] h-[500px] bg-[#282828] rounded-full opacity-20 blur-2xl bottom-20 right-20 animate-pulse"></div>
      </div>

      {/* Video Content */}
      <div className="bg-[#282828] p-6 rounded-3xl shadow-2xl max-w-6xl w-full text-center text-white relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
          {/* Local Video */}
          <div className="flex flex-col items-center">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="w-[400px] h-[300px] sm:w-[500px] sm:h-[400px] bg-gray-500 rounded-lg shadow-lg"
            />
            <p className="mt-4 text-lg text-gray-300 font-bold">You</p>
          </div>

          {/* Remote Video */}
          <div className="flex flex-col items-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              className="w-[400px] h-[300px] sm:w-[500px] sm:h-[400px] bg-gray-500 rounded-lg shadow-lg"
            />
            <p className="mt-4 text-lg text-gray-300 font-bold">
              {peerName || "Waiting for peer..."}
            </p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={toggleMic}
            className="p-4 bg-[#282828] rounded-full shadow-md hover:shadow-lg hover:bg-[#FC924B] transition-all"
          >
            {isMicOn ? (
              <Mic className="text-white w-6 h-6" />
            ) : (
              <MicOff className="text-red-500 w-6 h-6" />
            )}
          </button>
          <button
            onClick={toggleCamera}
            className="p-4 bg-[#282828] rounded-full shadow-md hover:shadow-lg hover:bg-[#FC924B] transition-all"
          >
            {isCameraOn ? (
              <Video className="text-white w-6 h-6" />
            ) : (
              <VideoOff className="text-red-500 w-6 h-6" />
            )}
          </button>
          <button
            onClick={handleLeaveRoom}
            className="px-6 py-3 bg-[#FC924B] text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:bg-[#D97940] transition-all"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Chat Section */}
      <div className="mt-8 bg-[#1e1e1e] p-4 rounded-lg shadow-lg max-w-6xl w-full z-10">
        <h2 className="text-xl font-bold text-white mb-4">Chat</h2>
        <div className="h-60 overflow-y-auto mb-4 bg-[#282828] p-4 rounded-lg">
          {messages.map((message, index) => (
            <div key={index} className="text-left text-white mb-2">
              {message}
            </div>
          ))}
        </div>
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 rounded-l-lg bg-[#1e1e1e] text-white placeholder-gray-400 outline-none focus:border-[#FC924B] border border-gray-700 z-10"
          />
          <button
            onClick={sendMessage}
            className="px-4 bg-[#FC924B] text-white rounded-r-lg hover:bg-[#D97940] transition-all"
          >
            Send
          </button>
        </div>
      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#282828] p-6 rounded-lg shadow-lg text-white max-w-sm w-full">
            <p className="text-lg font-bold mb-4">Are you sure you want to leave the room?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelLeaveRoom}
                className="px-4 py-2 bg-gray-500 rounded-lg text-white hover:bg-gray-600 transition-all"
              >
                No
              </button>
              <button
                onClick={confirmLeaveRoom}
                className="px-4 py-2 bg-[#FC924B] rounded-lg text-white hover:bg-[#D97940] transition-all"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
