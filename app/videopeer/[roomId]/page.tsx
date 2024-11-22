"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/context/Socketcontext";
import { useParams } from "next/navigation";

export default function VideoPeer() {
  const { socket } = useSocket();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const params = useParams();
  const roomId = params?.roomId as string | undefined;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !roomId) {
      setErrorMessage("Connection error. Please try rejoining.");
      return;
    }

    let localStream: MediaStream;
    let peerConnection: RTCPeerConnection;

    const config = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
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
          console.log("Sending ICE candidate:", event.candidate);
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
          peerConnection.addTrack(track, localStream);
        });

        socket.emit("readyForOffer", { roomId });
      } catch (error) {
        setErrorMessage("Failed to access camera and microphone. Please check your settings.");
      }
    };

    startConnection();

    socket.on("initiateOffer", async () => {
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit("sendOffer", { sdp: offer, roomId });
      } catch (error) {
        console.error("Error creating offer:", error);
      }
    });

    socket.on("receiveOffer", async ({ sdp }) => {
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit("sendAnswer", { sdp: answer, roomId });
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    });

    socket.on("receiveAnswer", async ({ sdp }) => {
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (error) {
        console.error("Error setting remote description:", error);
      }
    });

    socket.on("receiveIceCandidate", async ({ candidate }) => {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnection) {
        peerConnection.close();
      }
      socket.off("initiateOffer");
      socket.off("receiveOffer");
      socket.off("receiveAnswer");
      socket.off("receiveIceCandidate");
    };
  }, [socket, roomId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Video Call Room: {roomId}</h1>
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
      <div className="flex space-x-4">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className="w-1/2 border border-gray-300 rounded-lg shadow-md"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          className="w-1/2 border border-gray-300 rounded-lg shadow-md"
        />
      </div>
    </div>
  );
}
