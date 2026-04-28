import fs from "fs/promises";

export const deleteFileIfExists = async (filePath) => {
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`Failed to delete temp file at ${filePath}:`, error.message);
    }
  }
};
