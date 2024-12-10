// src/components/NavBar.tsx
"use client";
import { useRouter } from "next/navigation";
import Container from "./Containner";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Button } from "../ui/button";
import { useSocket } from "@/client/socket/context/Socketcontext"; 
import { useParams } from "next/navigation";

const NavBar = () => {
  const router = useRouter();
  const { userId } = useAuth();
  const { socket } = useSocket();
  const params = useParams();
  const roomId = params?.roomId as string | undefined;

  const handleNavigateHome = () => {
    if (roomId && socket) {
      const confirmed = window.confirm("Are you sure you want to leave the video call?");
      if (confirmed) {
        socket.emit("leaveRoom", { roomId });
        router.push("/");
      }
    } else {
      router.push("/");
    }
  };

  return (
    <div className="sticky top-0 bg-[#282828] border-b border-primary/10 z-50">
      <Container>
        <div className="flex justify-between items-center py-2">
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={handleNavigateHome}
          >
            <div className="font-bold text-xl 
                            bg-logo-gradient 
                            bg-clip-text 
                            text-transparent 
                            animate-colorShift 
                            bg-logo-size">
              Finver
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <UserButton />
            {!userId && (
              <>
                <Button onClick={() => router.push('/sign-in')} size='sm' variant='outline' className="px-2 py-1 text-sm">Sign in</Button>
                <Button onClick={() => router.push('/sign-up')} size='sm' className="px-2 py-1 text-sm">Sign up</Button>
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default NavBar;
