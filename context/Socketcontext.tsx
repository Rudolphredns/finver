import { SocketUser } from "@/types";
import { useUser } from "@clerk/nextjs";
import React, { createContext, useContext, useEffect, useState, Dispatch, SetStateAction } from "react";
import { io, Socket } from "socket.io-client";

// กำหนดโครงสร้างของ context ที่จะใช้ในแอป
interface iSocketContext {
  socket: Socket | null;
  onlineUsers: SocketUser[] | null;
  isSocketConnected: boolean;
  setOnlineUsers: Dispatch<SetStateAction<SocketUser[] | null>>; // เพิ่ม setOnlineUsers เพื่อให้ใช้งานได้
}

// สร้าง context สำหรับจัดการข้อมูล socket
export const SocketContext = createContext<iSocketContext | null>(null);

// Component ที่ใช้เป็น provider ให้ component อื่น ๆ เข้าถึง socket context ได้
export const SocketContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser(); // ใช้ hook ของ Clerk เพื่อดึงข้อมูลผู้ใช้
  const [socket, setSocket] = useState<Socket | null>(null); // สร้าง state สำหรับเก็บ socket instance
  const [isSocketConnected, setIsSocketConnected] = useState(false); // สร้าง state เพื่อตรวจสอบสถานะการเชื่อมต่อ
  const [onlineUsers, setOnlineUsers] = useState<SocketUser[] | null>(null); // สร้าง state สำหรับเก็บผู้ใช้ที่ออนไลน์

  // useEffect นี้ทำงานเมื่อข้อมูลผู้ใช้เปลี่ยน
  useEffect(() => {
    if (!user) return; // ถ้าไม่มีผู้ใช้ล็อกอิน ให้หยุดการทำงาน

    const newSocket = io("http://184.82.64.128:3000/"); // สร้างการเชื่อมต่อกับ socket ที่เซิร์ฟเวอร์
    setSocket(newSocket); // เก็บ socket instance ลงใน state

    return () => {
      newSocket.disconnect(); // ตัดการเชื่อมต่อเมื่อ component ถูก unmount
    };
  }, [user]);

  useEffect(() => {
    if (socket === null) return;

    function onConnect() {
      setIsSocketConnected(true);
    }

    function onDisconnect() {
      setIsSocketConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };

  }, [socket]);

  useEffect(() => {
    if (!socket || !isSocketConnected || !user) return;

    socket.emit('addnewUser', user);
    socket.on('getUser', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off('getUser');
    };

  }, [socket, isSocketConnected, user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isSocketConnected, setOnlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);

  if (context === null) {
    throw new Error("useSocket must be within a SocketProvider");
  }

  return context;
};
