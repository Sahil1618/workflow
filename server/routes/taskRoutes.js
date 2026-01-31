import express from "express";
import {
  creatTask,
  deleteTask,
  updateTask,
} from "../controllers/taskController.js";

const taskRouter = express.Router();

taskRouter.post("/", creatTask);
taskRouter.put("/:id", updateTask);
taskRouter.delete("/", deleteTask);

export default taskRouter;
