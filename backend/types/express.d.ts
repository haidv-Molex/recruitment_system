import "express";
import type { userOutputModel } from "@model/user/userModel";

declare global {
    namespace Express {
        interface User extends userOutputModel {
            email?: string;
            role?: 'user' | 'admin';
            accessToken?: string;
            refreshToken?: string;
        }
    }
}