import express from "express";
import isAuth from "../middleware/isAuth";

import * as GroupController from "../controllers/GroupController";
// import * as ImportPhoneContactsController from "../controllers/ImportPhoneContactsController";

const groupRoutes = express.Router();

groupRoutes.get("/group/info", isAuth, GroupController.getPessoalNumber);

groupRoutes.get("/group/:number", isAuth, GroupController.getDados);

groupRoutes.post("/group", isAuth, GroupController.store);

groupRoutes.put("/group/remove", isAuth, GroupController.groupRemove);

groupRoutes.put("/group/promoveAdmin", isAuth, GroupController.promoveAdmin);

groupRoutes.put("/group/removeAdmin", isAuth, GroupController.removeAdmin);

groupRoutes.put("/group/addPeoples", isAuth, GroupController.addParticipants);

groupRoutes.put("/group/onlyAdmin", isAuth, GroupController.onlyAdmin);

export default groupRoutes;
