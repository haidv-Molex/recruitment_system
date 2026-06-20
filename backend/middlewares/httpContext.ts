import { AsyncLocalStorage } from "async_hooks";
import { Request } from "express";

export const httpContext = new AsyncLocalStorage<Request>();
