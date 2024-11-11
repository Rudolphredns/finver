"use client";
import { Video } from "lucide-react";
import { useRouter } from "next/navigation";
import Container from "./Containner";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Button } from "../ui/button";
import { useSocket } from "@/context/Socketcontext"; // นำเข้า context ของ socket
import { useParams } from "next/navigation"; // ใช้ useParams เพื่อเข้าถึง roomId

const NavBar = () => {
  const router = useRouter();
  const { userId } = useAuth();
  const { socket } = useSocket(); // ใช้งาน socket จาก context
  const params = useParams();
  const roomId = params?.roomId as string | undefined; // ตรวจสอบ roomId เพื่อดูว่าอยู่ในห้องหรือไม่

  const handleNavigateHome = () => {
    if (roomId && socket) {
      // แสดงการยืนยันก่อนออกจากห้อง
      const confirmed = window.confirm("Are you sure you want to leave the video call?");
      if (confirmed) {
        socket.emit("leaveRoom", { roomId }); // ส่ง leaveRoom ไปที่ server
        router.push("/"); // นำผู้ใช้กลับไปที่หน้าหลัก
      }
    } else {
      router.push("/"); // ถ้าไม่ได้อยู่ในห้องก็ไปหน้าหลักเลย
    }
  };

  return (
    <div className="sticky top-0 border-b-primary/10">
      <Container>
        <div className="flex justify-between items-center">
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={handleNavigateHome} // เรียก handleNavigateHome เมื่อคลิก
          >
            <div className="font-bold text-2xl">Finver</div>
          </div>
          <div className="flex gap-3 items-center">
            <UserButton />
            {!userId && (
              <>
                <Button onClick={() => router.push('/sign-in')} size='sm' variant='outline'>Sign in</Button>
                <Button onClick={() => router.push('/sign-up')} size='sm' >Sign up</Button>
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default NavBar;
