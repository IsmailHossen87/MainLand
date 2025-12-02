import { Router } from "express";
import { FavouriteController } from "./Favourite.controller";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";

const router = Router();

router.post("/", (req, res, next) => {
    console.log("check hit the categhory", req.body)
    next()
},
    auth(USER_ROLES.USER, USER_ROLES.ORGANIZER), FavouriteController.FavouriteCreate
);

router.get("/", auth(USER_ROLES.USER, USER_ROLES.ORGANIZER), FavouriteController.FavouriteEvent)

export const FavouriteRouter = router;