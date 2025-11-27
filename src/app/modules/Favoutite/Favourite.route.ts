import { Router } from "express";
import { FavouriteController } from "./Favourite.controller";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";

const router = Router();

router.post("/", auth(USER_ROLES.USER,USER_ROLES.ORGANIZER),FavouriteController.FavouriteCreate
);

export const FavouriteRouter = router;