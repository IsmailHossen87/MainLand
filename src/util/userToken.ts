// // Access Token and Refresh Token

// import { JwtPayload } from "jsonwebtoken";

// import httpStatus from "http-status-codes"
// import { generateToken } from "./jwt";
// import config from "../config";


// // Access Token and Refresh Token created 
// export const createUserToken = (user: any) => {
//     const jwtPayload = {
//         userId: user._id,
//         email: user.email,
//         role: user.role
//     }

//     const accessToken = generateToken(jwtPayload, config.jwt.jwt_secret, config.jwt.jwt_expire_in)
//     // REFRESH token
//     const refreshToken = generateToken(jwtPayload, config.jwt.jwt_expire_in , config.jwt.jwt_expire_in)

//     return {
//         accessToken, refreshToken,

//     }
// }
// // And its function to do refreshToken uses Access Token

// export const createNewAccessTokenWinthRefreshToken = async (refreshToken: string) => {
//     const verifiedRefreshToken = verifyToken(refreshToken, envVars.JWT_REFRESH_SECRET) as JwtPayload


//     const isUserExites = await User.findOne({ email: verifiedRefreshToken.email })
//     if (!isUserExites) {
//         throw new AppError(httpStatus.BAD_REQUEST, "User  does not Exit")
//     }
//     if (isUserExites.isActive === IsActive.BLOCKED || isUserExites.isActive === IsActive.INACTIVE) {
//         throw new AppError(httpStatus.BAD_REQUEST, `User is ${isUserExites.isActive}`)
//     }
//     if (isUserExites.isDeleted) {
//         throw new AppError(httpStatus.BAD_REQUEST, "User is deleted")
//     }

//     const jwtPayload = {
//         userId: isUserExites._id,
//         email: isUserExites.email,
//         role: isUserExites.role
//     }

//     const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)

//     return accessToken
// }

// // all funtionality auth.service.ts