import { useEffect, useState } from "react";
import { connectSocket, getSocket } from "@/socketClient";

export const useSocket = (url: string) => {
    const [socket, setSocket] = useState<any>(null);

    useEffect(() => {
        const socketInstance = connectSocket(url);
        socketInstance.connect();

        setSocket(socketInstance);

        // Cleanup connection on unmount
        return () => {
            socketInstance.disconnect();
        };
    }, [url]);

    return socket;
};
