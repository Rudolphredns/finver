"use client";

import { useEffect, useRef } from "react";
import { useSocket } from "@/context/Socketcontext";
import { useParams } from "next/navigation";

export default function VideoPeer() {
  const { socket } = useSocket();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const params = useParams();
  const roomId = params?.roomId as string | undefined;

  useEffect(() => {
    if (!socket || !roomId) {
      console.error("Socket or roomId is missing.");
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
      createPeerConnection();

      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      localStream.getTracks().forEach((track) => {
        if (peerConnection.signalingState !== 'closed') {
          peerConnection.addTrack(track, localStream);
        }
      });
    };

    // เริ่มการเชื่อมต่อ
    startConnection();

    // ฟัง event เมื่อมีการจับคู่
    socket.on("videoMatched", (data) => {
      console.log("Video matched with:", data.peerUser);
      console.log("Room ID:", data.roomId);
      
      // หลังจากจับคู่แล้ว ส่ง offer
      socket.emit("sendOffer", { roomId });
    });

    // ฟัง event รับ ICE candidate
    socket.on("receiveIceCandidate", (candidate) => {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    // ฟัง event รับ Offer
    socket.on("receiveOffer", async (offer) => {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("sendAnswer", { answer: peerConnection.localDescription, roomId });
    });

    // ฟัง event รับ Answer
    socket.on("receiveAnswer", async (answer) => {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    return () => {
      socket.off("receiveIceCandidate");
      socket.off("receiveOffer");
      socket.off("receiveAnswer");
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, [socket, roomId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Video Call Room: {roomId}</h1>
      <div className="flex space-x-4">
        <video ref={localVideoRef} autoPlay muted className="w-1/2" />
        <video ref={remoteVideoRef} autoPlay className="w-1/2" />
      </div>
    </div>
  );
}
