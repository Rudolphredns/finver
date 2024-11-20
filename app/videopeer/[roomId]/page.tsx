"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/context/Socketcontext";
import { useParams, useRouter } from "next/navigation";

export default function VideoPeer() {
  const { socket } = useSocket();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string | undefined;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [peerName, setPeerName] = useState<string | null>(null); // แก้เป็น null เพื่อรองรับสถานะรอข้อมูล

  useEffect(() => {
    if (!socket || !roomId) {
      console.error("Socket or roomId is missing.");
      setErrorMessage("Connection error. Please try rejoining.");
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

    const createPeerConnection = () => {
      peerConnection = new RTCPeerConnection(config);

      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("sendIceCandidate", { candidate: event.candidate, roomId });
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
        setErrorMessage("Failed to access camera and microphone. Please check your settings.");
      }
    };

    startConnection();

    socket.on("peerLeftRoom", () => {
      console.log("Your peer has left the room.");
      setErrorMessage("Your peer has left the room.");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    });

    // ฟัง Event ชื่อของคู่สนทนา
    socket.on("peerUserInfo", (data: { name: string }) => {
      console.log("Received peerUserInfo event:", data); // ตรวจสอบข้อมูลใน Console
      setPeerName(data.name || "Anonymous User");
    });

    return () => {
      socket.off("peerLeftRoom");
      socket.off("peerUserInfo");

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, [socket, roomId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Video Call Room: {roomId}</h1>
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
      <div className="flex space-x-4">
        {/* วิดีโอของตัวเอง */}
        <div className="flex flex-col items-center">
          <video ref={localVideoRef} autoPlay muted className="w-64 h-48 bg-gray-200 rounded-lg" />
          <p className="mt-2 text-gray-700 font-semibold">You</p>
        </div>

        {/* วิดีโอของคู่สนทนา */}
        <div className="flex flex-col items-center">
          <video ref={remoteVideoRef} autoPlay className="w-64 h-48 bg-gray-200 rounded-lg" />
          <p className="mt-2 text-gray-700 font-semibold">
            {peerName || "Waiting for peer..."} {/* แสดงข้อความรอ */}
          </p>
        </div>
      </div>
    </div>
  );
}
