import "express";
import type { userModel } from "@model/user/userModel";

declare global {
    namespace Express {
        interface User extends userModel {
            email?: string;
            role?: 'user' | 'admin';
            accessToken?: string;
            refreshToken?: string;
        }
    }
}