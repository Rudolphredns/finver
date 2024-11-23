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
    <div className="sticky top-0 w-full bg-[#282828] text-white outline outline-4 outline-[#FC924B]">
  <div className="max-w-screen-xl mx-auto p-4">
    <div className="flex justify-between items-center">
      {/* Logo and Navigation */}
      <div
        className="flex items-center gap-1 cursor-pointer"
        onClick={handleNavigateHome}
      >
        <div className="font-bold text-2xl">Finver</div>
      </div>

      {/* User Authentication and Buttons */}
      <div className="flex gap-4 items-center">
        <UserButton />
        {!userId && (
          <>
            <Button
              onClick={() => router.push('/sign-in')}
              size="sm"
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white hover:text-[#282828]"
            >
              Sign in
            </Button>
            <Button
              onClick={() => router.push('/sign-up')}
              size="sm"
              className="bg-[#1D9A64] text-white hover:bg-[#157a4c]"
            >
              Sign up
            </Button>
          </>
        )}
      </div>
    </div>
  </div>
</div>

  );
};

export default NavBar;
