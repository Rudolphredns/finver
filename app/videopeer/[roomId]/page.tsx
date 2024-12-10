"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/client/socket/context/Socketcontext";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

export default function VideoPeer() {
  const { socket } = useSocket();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string | undefined;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

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
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit("sendOffer", { sdp: offer, roomId });
    });

    socket.on("receiveOffer", async ({ sdp }) => {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("sendAnswer", { sdp: answer, roomId });
    });

    socket.on("receiveAnswer", async ({ sdp }) => {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on("receiveIceCandidate", async ({ candidate }) => {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent text-foreground relative overflow-hidden">
      {/* Background Animations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] bg-primary rounded-full opacity-10 blur-3xl top-20 left-20 animate-pulse"></div>
        <div className="absolute w-[500px] h-[500px] bg-secondary rounded-full opacity-20 blur-2xl bottom-20 right-20 animate-pulse"></div>
      </div>

      {/* Main Content */}
      <div className="bg-card p-6 rounded-3xl shadow-2xl max-w-4xl w-full text-center relative z-10">
        {errorMessage && (
          <p className="text-destructive font-medium mb-6">{errorMessage}</p>
        )}

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Local Video */}
          <div className="flex flex-col items-center">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="w-[300px] h-[200px] md:w-[400px] md:h-[300px] bg-gray-700 rounded-lg shadow-lg"
            />
            <p className="mt-4 text-muted-foreground font-bold">You</p>
          </div>

          {/* Remote Video */}
          <div className="flex flex-col items-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              className="w-[300px] h-[200px] md:w-[400px] md:h-[300px] bg-gray-700 rounded-lg shadow-lg"
            />
            <p className="mt-4 text-muted-foreground font-bold">Peer</p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={toggleMic}
            className="p-4 bg-muted rounded-full shadow-md hover:shadow-lg hover:bg-primary transition-all"
          >
            {isMicOn ? (
              <Mic className="text-white w-6 h-6" />
            ) : (
              <MicOff className="text-destructive w-6 h-6" />
            )}
          </button>
          <button
            onClick={toggleCamera}
            className="p-4 bg-muted rounded-full shadow-md hover:shadow-lg hover:bg-primary transition-all"
          >
            {isCameraOn ? (
              <Video className="text-white w-6 h-6" />
            ) : (
              <VideoOff className="text-destructive w-6 h-6" />
            )}
          </button>
          <button
            onClick={handleLeaveRoom}
            className="px-6 py-3 bg-accent text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:bg-accent-dark transition-all"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg text-white max-w-sm w-full">
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
                className="px-4 py-2 bg-accent rounded-lg text-white hover:bg-accent-dark transition-all"
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
