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

      // Handle receiving tracks from the remote peer
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle sending ICE candidates to the remote peer
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate");
          socket.emit("sendIceCandidate", { candidate: event.candidate, roomId });
        }
      };
    };

    const startConnection = async () => {
      try {
        createPeerConnection();

        // Get the user's media stream and add tracks to the peer connection
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
        console.error("Error starting connection:", error);
        setErrorMessage("Failed to access camera and microphone. Please check your settings.");
      }
    };

    // Start the connection process
    startConnection();

    // Listen for matched event to initiate the call
    socket.on("videoMatched", ({ peerUser, roomId, initiator }) => {
      console.log("Video matched with:", peerUser);
      console.log("Room ID:", roomId);

      if (roomId) {
        if (initiator) {
          // The current user is the initiator; create and send an offer
          peerConnection.createOffer()
            .then((offer) => {
              console.log("Creating and sending offer");
              return peerConnection.setLocalDescription(offer);
            })
            .then(() => {
              socket.emit("sendOffer", { offer: peerConnection.localDescription, roomId });
            })
            .catch((error) => {
              console.error("Error creating offer:", error);
              setErrorMessage("Failed to create connection. Please try again.");
            });
        } else {
          console.log("Waiting to receive offer");
        }
      } else {
        console.error("No room ID received from server.");
        setErrorMessage("Failed to join the room. No room ID received.");
      }
    });

    // Listen for ICE candidates from the server
    socket.on("receiveIceCandidate", (candidate) => {
      if (peerConnection && candidate) {
        console.log("Received ICE candidate");
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
          .catch((error) => {
            console.error("Error adding received ICE candidate:", error);
          });
      }
    });

    // Listen for an offer from the other user
    socket.on("receiveOffer", async (offer) => {
      try {
        console.log("Received offer, creating answer");
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("sendAnswer", { answer: peerConnection.localDescription, roomId });
      } catch (error) {
        console.error("Error handling received offer:", error);
        setErrorMessage("Failed to handle incoming connection offer.");
      }
    });

    // Listen for an answer from the other user
    socket.on("receiveAnswer", async (answer) => {
      try {
        console.log("Received answer, setting remote description");
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error("Error handling received answer:", error);
        setErrorMessage("Failed to establish the connection.");
      }
    });

    // Clean up when the component unmounts
    return () => {
      socket.off("videoMatched");
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
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
      <div className="flex space-x-4">
        <video ref={localVideoRef} autoPlay muted className="w-1/2" />
        <video ref={remoteVideoRef} autoPlay className="w-1/2" />  
      </div>
    </div>
  );
}
