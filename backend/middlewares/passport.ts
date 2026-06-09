import { withTransaction } from "@middlewares/withTransaction";
import passport from "passport";
import { v4 as uuidv4 } from "uuid";
import { Strategy } from "passport-local";
import { Strategy as CustomStrategy } from "passport-custom";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptionsWithRequest } from "passport-jwt";
import jwt, { Secret, SignOptions } from "jsonwebtoken";

import User from "@services/user/User";
import redis, { getCache, setCache } from "@middlewares/redisClient";
import jwtTimeToSeconds from "@utilities/jwtTimeToSeconds";

import { AppError } from "@middlewares/AppError";

type payloadtype = {
  user_id: number,
  user_name: string
}

const cookiePath = "/Auth/token"
const secretOrKey = process.env.SECRET_AUTH_TOKEN_KEY as string;
const expiresToken = process.env.EXPIRES_TOKEN as SignOptions["expiresIn"];
const expiresRefreshToken = process.env.EXPIRES_REFRESH_TOKEN as SignOptions["expiresIn"];

async function accessTokenGenerate({ user_id, user_name }: payloadtype): Promise<string> {
  const payload = { user_id: user_id, name: user_name };
  return jwt.sign(payload, secretOrKey, { expiresIn: expiresToken });
}

async function refreshTokenGenerate(user_id: number): Promise<string> {
  const jti = uuidv4();
  const payload = { user_id, jti };
  const refreshToken = jwt.sign(payload, secretOrKey, { expiresIn: expiresRefreshToken });
  await setCache(`refreshToken:${user_id}:${jti}`, refreshToken, await jwtTimeToSeconds(process.env.EXPIRES_REFRESH_TOKEN || "30d"));

  return refreshToken;
}

// ##############################
// MARK: khoá tài khoản sau n lần gửi sai mật khẩu
// ##############################

const MAX_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS) || 5;           // số lần thử tối đa
const LOCK_TIME = Number(process.env.LOCK_TIME) || 15 * 60;        // 15 phút (s)

export async function checkLoginAttempt(key: string): Promise<undefined> {
  const attempts = await redis.get(key);

  if (attempts && Number(attempts) >= MAX_ATTEMPTS) {
    const ttl = await redis.ttl(key);
    throw new AppError(`Tài khoản bị khóa. Thử lại sau ${ttl} giây.`, 423);
  }
}

export async function increaseLoginAttempt(key: string) {
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    // lần đầu sai -> set TTL cho key
    await redis.expire(key, LOCK_TIME);
  }

  if (attempts >= MAX_ATTEMPTS) {
    // vượt ngưỡng -> khóa luôn
    await redis.expire(key, LOCK_TIME);
  }
}

export async function resetLoginAttempt(key: string) {
  await redis.del(key);
}

// ##############################
// MARK: call back có dạng cb(error: any, data?: any, info?: IVerifyOptions)
// return cb(null, {user, token}, { message });
// ##############################

passport.use(
  "login",
  new Strategy({
    usernameField: 'account', // Sử dụng account làm username
    passwordField: 'password', // Trường mật khẩu
    passReqToCallback: true,
  }, async function verify(req, account, password, cb) {
    try {
      //kiểm tra xem có account ko
      const user = await withTransaction(async (pool) => {
        try {
          return await User.findByEmail(account, pool)
        } catch (error) {
          throw new AppError("Tài khoản hoặc mật khẩu không chính xác", 401);
        }
      })

      // kiểm tra số lần cố đăng nhập của user
      const cacheKey = `login_fail:${user.user_id}`;
      await checkLoginAttempt(cacheKey);

      const valid = await withTransaction(async (pool) => {
        return await User.comparePassword(password, user.user_id, pool)
      })
      if (!valid) {
        // đăng nhập thất bại -> tăng số lần thử
        await increaseLoginAttempt(cacheKey);
        return cb(null, false, { message: 'Sai mật khẩu' });
      }

      // đăng nhập thành công -> reset lại
      await resetLoginAttempt(cacheKey);

      const [refreshToken, accessToken] = await Promise.all([
        refreshTokenGenerate(user.user_id),
        accessTokenGenerate({
          user_id: user.user_id,
          user_name: user.user_name
        })
      ])

      const role = await withTransaction(async (pool) => {
        try {
          const isUserAdmin = await User.isAdmin(user.user_id, pool);
          return isUserAdmin ? 'admin' : 'user';
        } catch {
          return 'user';
        }
      })

      req.res!.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: cookiePath,
        maxAge: await jwtTimeToSeconds(process.env.EXPIRES_REFRESH_TOKEN || "30d") * 1000,
      });

      return cb(null, { ...user, user_account: account, user_role: role, accessToken, refreshToken }, { message: 'Đăng nhập thành công' });

    } catch (err) {
      if (err instanceof AppError) {
        return cb(null, false, { message: err.message, status: err.statusCode } as any);
      }

      return cb(new AppError("Lỗi hệ thống", 500));
    }
  })
);

// đăng nhập bằng google
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: `${process.env.HOST}/Auth/google/callback`,
      passReqToCallback: true
    },
    async (req, accessToken: string, refreshToken: string, profile: Profile, cb: VerifyCallback) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return cb(null, false, { message: "Google profile does not contain an email", status: 400 });
        }

        const result = await withTransaction(async (pool) => {
          return await User.findByEmail(email, pool);
        })

        if (!result) {
          const newUser = await withTransaction(async (pool) => {
            return await User.create(
              email,
              "google", // Set mặc định cho tài khoản Google
              profile.displayName,
              pool
            );
          })
          const [refreshToken, accessToken] = await Promise.all([
            refreshTokenGenerate(newUser.user_id),
            accessTokenGenerate({
              user_id: newUser.user_id,
              user_name: newUser.user_name
            })
          ])

          req.res!.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: cookiePath,
            maxAge: await jwtTimeToSeconds(process.env.EXPIRES_REFRESH_TOKEN || "30d") * 1000,
          });

          const role = await withTransaction(async (pool) => {
            try {
              const isUserAdmin = await User.isAdmin(newUser.user_id, pool);
              return isUserAdmin ? 'admin' : 'user';
            } catch {
              return 'user';
            }
          })

          return cb(null, { ...newUser, email, role, accessToken, refreshToken }, { message: "tạo tài khoản thành công" });
        } else {
          const [refreshToken, accessToken] = await Promise.all([
            refreshTokenGenerate(result.user_id),
            accessTokenGenerate({
              user_id: result.user_id,
              user_name: result.user_name
            })
          ])

          req.res!.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: cookiePath,
            maxAge: await jwtTimeToSeconds(process.env.EXPIRES_REFRESH_TOKEN || "30d") * 1000,
          });

          const role = await withTransaction(async (pool) => {
            try {
              const isUserAdmin = await User.isAdmin(result.user_id, pool);
              return isUserAdmin ? 'admin' : 'user';
            } catch {
              return 'user';
            }
          })

          return cb(null, { ...result, email, role, accessToken, refreshToken }, { message: "Đăng nhập thành công" });
        }
      } catch (err) {
        if (err instanceof AppError) {
          return cb(null, false, { message: err.message });
        }

        return cb(new AppError("Lỗi hệ thống", 500));
      }
    }
  )
);

passport.use(
  "token",
  new CustomStrategy(async (req, cb) => {
    try {
      // 🟢 Ưu tiên lấy refresh token từ body (mobile app)
      let refreshTokenFromClient =
        req.body?.refreshToken ||
        req.cookies?.refreshToken ||
        req.headers["x-refresh-token"]; // fallback (trường hợp đặc biệt)

      if (!refreshTokenFromClient) {
        return cb(new AppError("không tìm thấy refreshToken, vui lòng đăng nhập", 401));
      }

      // 🟣 Lấy access token từ header (nếu có)
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

      // 🧩 Giải mã access token nếu có (cho phép hết hạn)
      let accessPayload: any = null;
      if (accessToken) {
        try {
          accessPayload = jwt.verify(accessToken, secretOrKey);
        } catch (err: any) {
          if (err.name === "TokenExpiredError") {
            // Token hết hạn vẫn decode để lấy payload
            accessPayload = jwt.decode(accessToken);
          } else {
            // Token lỗi thật thì bỏ qua, không cần return cb()
            accessPayload = null;
          }
        }
        if (accessPayload?.user_id && accessPayload?.jti) {
          const expiresAccessToken = await jwtTimeToSeconds(process.env.EXPIRES_TOKEN || "15m");
          await setCache(`blacklist:${accessToken}`, "true", expiresAccessToken);
        }
      }

      // 🧩 Giải mã refresh token
      let refreshPayload: any;
      try {
        refreshPayload = jwt.verify(refreshTokenFromClient, secretOrKey);
      } catch (err) {
        return cb(new AppError("Refresh token không hợp lệ hoặc đã hết hạn.", 403));
      }

      // 🔍 Kiểm tra refresh token trong Redis
      const cacheKey = `refreshToken:${refreshPayload.user_id}:${refreshPayload.jti}`;
      const refreshTokenInRedis = await getCache(cacheKey);

      if (!refreshTokenInRedis || refreshTokenInRedis !== refreshTokenFromClient) {
        return cb(new AppError("Refresh token không khớp hoặc đã bị thu hồi.", 403));
      }

      // 🔹 Tìm user trong DB
      const user = await withTransaction(async (pool) => {
        return await User.findById(refreshPayload.user_id, pool);
      })
      // 🔹 Cấp lại access token mới
      const newAccessToken = await accessTokenGenerate({
        user_id: user.user_id,
        user_name: user.user_name,
      });

      return cb(null, { accessToken: newAccessToken });
    } catch (err) {
      return cb(new AppError("Lỗi hệ thống", 500));
    }
  })
);

passport.use(
  "logout",
  new CustomStrategy(async (req, cb) => {
    try {
      const refreshTokenFromClient = req.cookies?.refreshToken || req.body?.refreshToken;
      const accessToken = req.headers.authorization?.split(" ")[1];

      // ✅ Cho token vào blacklist Redis
      const expiresAccessToken = await jwtTimeToSeconds(process.env.EXPIRES_TOKEN || "15m");
      const expRefreshToken = await jwtTimeToSeconds(process.env.EXPIRES_REFRESH_TOKEN || "30d")
      await setCache(`blacklist:${accessToken}`, "true", expiresAccessToken);
      await setCache(`blacklist:${refreshTokenFromClient}`, "true", expRefreshToken);

      // ✅ Xoá refreshToken cookie
      req.res!.clearCookie("refreshToken", {
        path: cookiePath,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
      });

      return cb(null, { message: "Đăng xuất thành công" });
    } catch (err) {
      if (err instanceof AppError) {
        return cb(err);
      }
      return cb(new AppError("Lỗi hệ thống", 500));
    }
  })
);

passport.use(
  "deleteAccount",
  new CustomStrategy(async (req, cb) => {
    try {
      const refreshTokenFromClient = req.cookies?.refreshToken || req.body?.refreshToken;
      const accessToken = req.headers.authorization?.split(" ")[1];

      if (!refreshTokenFromClient) {
        return cb(new AppError("không tìm thấy refreshToken, vui lòng đăng nhập", 401));
      }

      // 🧩 Giải mã refresh token
      let refreshPayload: any;
      try {
        refreshPayload = jwt.verify(refreshTokenFromClient, secretOrKey);
      } catch (err) {
        return cb(new AppError("Refresh token không hợp lệ hoặc đã hết hạn.", 403));
      }

      const user = await withTransaction(async (pool) => {
        return await User.deleteAccount(refreshPayload.user_id, pool);
      })

      // ✅ Cho token vào blacklist Redis
      const expiresAccessToken = await jwtTimeToSeconds(process.env.EXPIRES_TOKEN || "15m");
      const expRefreshToken = await jwtTimeToSeconds(process.env.EXPIRES_REFRESH_TOKEN || "30d")
      await setCache(`blacklist:${accessToken}`, "true", expiresAccessToken);
      await setCache(`blacklist:${refreshTokenFromClient}`, "true", expRefreshToken);

      // ✅ Xoá refreshToken cookie
      req.res!.clearCookie("refreshToken", {
        path: cookiePath,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
      });

      return cb(null, { message: "Xoá tài khoản thành công" });
    } catch (err) {
      if (err instanceof AppError) {
        return cb(err);
      }
      return cb(new AppError("Lỗi hệ thống", 500));
    }
  })
);

// JWT strategy
const options: StrategyOptionsWithRequest = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SECRET_AUTH_TOKEN_KEY as string,
  passReqToCallback: true,
};

passport.use(
  new JwtStrategy(options, async (req, payload: payloadtype, cb) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      // Kiểm tra blacklist trong Redis
      const blacklisted = await getCache(`blacklist:${token}`);
      if (blacklisted) {
        return cb(null, false, { message: "Token đã bị thu hồi" });
      }

      const user = await withTransaction(async (pool) => {
        await User.checkUserBanned(payload.user_id, pool);
        return await User.findById(payload.user_id, pool);
      })

      if (!user) {
        return cb(null, false, { message: "không tồn tại người dùng" });
      }

      return cb(null, user, { message: "xác thực thành công" });

    } catch (err) {
      // AppError (bao gồm 403 khi bị ban) → trả về err để Express xử lý đúng status code
      if (err instanceof AppError) {
        return cb(err);
      }

      return cb(new AppError("Lỗi hệ thống", 500));
    }
  })
);

export default passport;
