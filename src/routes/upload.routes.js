import { Router } from "express";
import { analyzeUpload } from "../controllers/upload.controller.js";
import { uploadSingleFile } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/analyze", uploadSingleFile, asyncHandler(analyzeUpload));

export default router;
