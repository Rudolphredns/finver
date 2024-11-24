"use client";

import { useUser } from "@clerk/nextjs";
import { useSocket } from "@/context/Socketcontext";
import { useEffect } from "react";
import { SocketUser } from "@/types";

const ListOnlineUser = () => {
    const { user } = useUser();
    const { socket, onlineUsers, setOnlineUsers } = useSocket();

    useEffect(() => {
        if (!socket) {
            console.warn("Socket not initialized!");
            return;
        }

        if (!socket.connected) {
            console.warn("Socket not connected!");
            return;
        }

        // ฟัง event 'getUser' เพื่อรับข้อมูลผู้ใช้ที่ออนไลน์ทั้งหมด
        const handleGetUserList = (users: SocketUser[] | null) => {
            console.log("Received online users:", users);
            setOnlineUsers(users || []);
        };

        // ฟัง event 'getUser'
        socket.on("getUser", handleGetUserList);

        // ฟัง event 'error'
        socket.on("error", (error) => {
            console.error("Socket error:", error);
        });

        // ลบ listeners เมื่อ component ถูก unmount
        return () => {
            socket.off("getUser", handleGetUserList);
            socket.off("error");
        };
    }, [socket, setOnlineUsers]);

    if (!onlineUsers) {
        return <div>ไม่มีผู้ใช้ออนไลน์</div>;
    }

    return (
        <div>
            <h2>จำนวนคนออนไลน์: {onlineUsers.length} คน</h2>
            {onlineUsers.map((onlineUser) => (
                <div key={onlineUser.userId}>
                    <div>{onlineUser.profile?.username || "Unknown User"}</div>
                </div>
            ))}
        </div>
    );
};

export default ListOnlineUser;
