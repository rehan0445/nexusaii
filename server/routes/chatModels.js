import { Router } from "express";
const modelRouter = Router();
import { getAllChatModels, getChatModelById } from "../controllers/chatModelController.js";

modelRouter.get("/", getAllChatModels);
modelRouter.get("/:id", getChatModelById);

export default modelRouter;