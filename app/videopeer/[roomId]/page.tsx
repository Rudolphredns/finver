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
        router.push("/"); // นำผู้ใช้กลับไปหน้าหลัก
      }, 2000); // รอ 2 วินาทีก่อนนำกลับไปหน้าแรก
    });

    // ฟังก์ชันสำหรับการแจ้งเตือนก่อนออกจากห้อง
    const confirmLeaveRoom = () => {
      const confirmed = window.confirm("Are you sure you want to leave the video call?");
      if (confirmed) {
        socket.emit("leaveRoom", { roomId });
        router.push("/"); // นำผู้ใช้กลับไปหน้าหลัก
      }
    };

    // เพิ่ม Event listener สำหรับการออกจากหน้า
    window.addEventListener("beforeunload", (event) => {
      event.preventDefault();
      event.returnValue = ""; // สำหรับ browser บางประเภทจะแสดงกล่องแจ้งเตือนโดยอัตโนมัติ
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        confirmLeaveRoom(); // เรียกใช้ confirmLeaveRoom เมื่อผู้ใช้พยายามออกจากหน้า
      }
    });

    return () => {
      socket.off("peerLeftRoom");
      window.removeEventListener("beforeunload", confirmLeaveRoom);
      document.removeEventListener("visibilitychange", confirmLeaveRoom);

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
        <video ref={localVideoRef} autoPlay muted className="w-1/2" />
        
      </div>
    </div>
  );
}
