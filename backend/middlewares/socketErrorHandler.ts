import { Socket } from "socket.io";
import { AppError } from "@middlewares/AppError";

function socketErrorHandler(socket: Socket) {
  const safeHandler = <T extends any[]>(
    event: string,
    handler: (...args: T) => Promise<void> | void
  ): void => {
    socket.on(event, async (...args: T) => {
      try {
        await handler(...args);
      } catch (err) {
        if (err instanceof AppError) {
          socket.emit("error_message", err.toSocketPayload());
        } else {
          socket.emit("error_message", {
            message: "Đã xảy ra lỗi không xác định.",
          });
        }
      }
    });
  };

  return safeHandler;
}

export default socketErrorHandler