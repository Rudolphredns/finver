import { User } from "@clerk/nextjs/server";

export type SocketUser = {
    userId: string;
    sockerId: string;
    profile: User
    [key: string]: any;
}