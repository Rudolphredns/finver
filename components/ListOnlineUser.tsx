"use client";

import { useUser } from "@clerk/nextjs";
import { useSocket } from "@/context/Socketcontext";
import { SetStateAction, useEffect } from "react";
import { SocketUser } from "@/types";

const ListOnlineUser = () => {
    const { user } = useUser();
    const { socket, onlineUsers, setOnlineUsers } = useSocket();

    useEffect(() => {
        if (socket) {
            // ฟัง event 'getUser' เพื่อรับข้อมูลผู้ใช้ที่ออนไลน์ทั้งหมดทุกครั้งที่ client เชื่อมต่อใหม่
            const handleGetUserList = (users: SetStateAction<SocketUser[] | null>) => {
                setOnlineUsers(users);
            };

            socket.on("getUser", handleGetUserList);

            // ลบ listener เมื่อ component ถูกยกเลิก
            return () => {
                socket.off("getUser", handleGetUserList);
            };
        }
    }, [socket]);

    return (
        <div>
            <h2>จำนวนคนออนไลน์: {onlineUsers ? onlineUsers.length : 0} คน</h2>
            {onlineUsers && onlineUsers.map((onlineUser) => {
                return (
                    <div key={onlineUser.userId}>
                        <div>{onlineUser.profile.username}</div>
                    </div>
                );
            })}
        </div>
    );
};

export default ListOnlineUser;
