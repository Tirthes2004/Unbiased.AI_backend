import { deleteFileIfExists } from "../utils/fileCleanup.js";
import { sendToMlApi, streamToBuffer } from "../services/ml.service.js";

const isJsonResponse = (contentType) => contentType.includes("application/json");

const isPdfResponse = (contentType) => contentType.includes("application/pdf");

const waitForResponseToFinish = (res) =>
  new Promise((resolve, reject) => {
    res.on("finish", resolve);
    res.on("close", resolve);
    res.on("error", reject);
  });

export const analyzeUpload = async (req, res) => {
  let uploadedFilePath;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "A file is required in the multipart field named 'file'.",
      });
    }

    uploadedFilePath = req.file.path;

    // const fields = {
    //   patientName: req.body.patientName,
    //   age: req.body.age,
    //   reportType: req.body.reportType,
    //   notes: req.body.notes,
    // };

    const mlResult = await sendToMlApi({
      file: req.file,
      // fields,
    });

    if (isJsonResponse(mlResult.contentType)) {
      const buffer = await streamToBuffer(mlResult.stream);
      const data = JSON.parse(buffer.toString("utf8"));

      return res.status(200).json({
        success: true,
        data,
      });
    }

    if (isPdfResponse(mlResult.contentType)) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        mlResult.contentDisposition || 'attachment; filename="ml-result.pdf"'
      );

      mlResult.stream.pipe(res);
      await waitForResponseToFinish(res);
      return;
    }

    const buffer = await streamToBuffer(mlResult.stream);

    return res.status(200).json({
      success: true,
      data: {
        contentType: mlResult.contentType,
        result: buffer.toString("utf8"),
      },
    });
  } finally {
    await deleteFileIfExists(uploadedFilePath);
  }
};
