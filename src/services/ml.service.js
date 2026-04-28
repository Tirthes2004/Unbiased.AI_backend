import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import { env } from "../config/env.js";

const buildMlFormData = (file) => {
  const form = new FormData();

  form.append("file", fs.createReadStream(file.path), {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  // for (const [key, value] of Object.entries(fields)) {
  //   if (value !== undefined && value !== null) {
  //     form.append(key, String(value));
  //   }
  // }

  return form;
};

export const sendToMlApi = async ({ file }) => {
  const form = buildMlFormData(file);

  const response = await axios.post(`${env.mlApiUrl}`, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    responseType: "stream",
    timeout: 120000,
    validateStatus: (status) => status >= 200 && status < 300,
  });

  return {
    contentType: response.headers["content-type"] || "application/octet-stream",
    contentDisposition: response.headers["content-disposition"],
    stream: response.data,
  };
};

export const streamToBuffer = async (stream) => {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};
