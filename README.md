# Express ML Upload Backend

Production-ready Express.js backend for receiving a file from a frontend, temporarily storing it on the server, sending it to an external ML API, returning the ML result to the frontend, and deleting the temporary upload after processing.

## Request Flow

```txt
Frontend
  -> Express Backend
  -> Multer saves temp file in uploads/
  -> Controller sends file to ML API
  -> ML API returns JSON, PDF, or another response
  -> Backend sends result to frontend
  -> Backend deletes temp file
```

The uploaded file is stored only temporarily. It is not saved in a database.

## Tech Stack

- Node.js
- Express.js
- Multer
- Axios
- FormData
- dotenv
- cors
- helmet
- morgan
- express-rate-limit

## Folder Structure

```txt
backend/
|-- src/
|   |-- config/
|   |   `-- env.js
|   |-- controllers/
|   |   `-- upload.controller.js
|   |-- routes/
|   |   `-- upload.routes.js
|   |-- services/
|   |   `-- ml.service.js
|   |-- middleware/
|   |   |-- upload.js
|   |   |-- errorHandler.js
|   |   `-- notFound.js
|   |-- utils/
|   |   |-- fileCleanup.js
|   |   `-- asyncHandler.js
|   |-- app.js
|   `-- server.js
|-- uploads/
|-- .env
|-- .gitignore
|-- package.json
`-- README.md
```

## Setup From Zero

```bash
npm init -y
npm install express multer axios form-data dotenv cors helmet morgan express-rate-limit
npm install -D nodemon
```

For this project after cloning or opening the folder:

```bash
cd backend
npm install
```

## Environment Variables

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
ML_API_URL=https://your-ml-api.com
NODE_ENV=development
```

Meaning:

- `PORT`: backend server port.
- `CLIENT_URL`: frontend URL allowed by CORS.
- `ML_API_URL`: external ML API URL.
- `NODE_ENV`: `development` locally, `production` when deployed.

## Run The Server

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Syntax check:

```bash
npm run check
```

## API Endpoints

### Health Check

```txt
GET /
```

Response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "environment": "development"
  }
}
```

### Analyze Upload

```txt
POST /api/upload/analyze
```

Content type:

```txt
multipart/form-data
```

Accepted field:

```txt
file
```

Example optional text fields from a frontend:

```txt
patientName
age
reportType
notes
```

Note: the current service forwards the uploaded file to the ML API. If your ML API also needs body fields, uncomment the `fields` code in `src/controllers/upload.controller.js` and `src/services/ml.service.js`.

## File Upload Rules

Configured in `src/middleware/upload.js`.

Allowed MIME types:

- `application/pdf`
- `image/png`
- `image/jpeg`
- `text/csv`

Current file size limit:

```txt
500MB
```

The file is stored temporarily in:

```txt
uploads/
```

The filename is changed to a safe unique name using:

```txt
Date.now() + crypto.randomUUID()
```

## Successful JSON Response

If the ML API returns JSON:

```json
{
  "prediction": "Pneumonia",
  "confidence": 0.94
}
```

The backend returns:

```json
{
  "success": true,
  "data": {
    "prediction": "Pneumonia",
    "confidence": 0.94
  }
}
```

## PDF Response

If the ML API returns a PDF, the backend streams the PDF directly to the frontend and sets:

```txt
Content-Type: application/pdf
Content-Disposition: attachment; filename="ml-result.pdf"
```

The temporary uploaded file is still deleted after the stream completes.

## Error Response

Errors use this format:

```json
{
  "success": false,
  "message": "Something went wrong"
}
```

Examples:

- Missing file
- Invalid file type
- File too large
- ML API request fails
- Unknown route

## File-by-File Explanation

### `src/server.js`

Starts the HTTP server.

Why it exists:

This file listens on the configured port and handles graceful shutdown.

How it connects:

It imports `app` from `src/app.js`.

Beginner mistake:

Putting all app setup and server startup in one file makes the project harder to test and maintain.

### `src/app.js`

Creates and configures the Express app.

What it does:

- Enables Helmet security headers.
- Enables CORS for the frontend.
- Logs requests using Morgan.
- Parses JSON and URL-encoded body data.
- Applies rate limiting.
- Registers upload routes.
- Registers 404 and error middleware.

How it connects:

It imports routes from `src/routes/upload.routes.js`.

Beginner mistake:

Forgetting CORS causes browser requests from React to fail even when the backend works in Postman.

### `src/config/env.js`

Loads and validates environment variables.

Why it exists:

The app should not hardcode ports, frontend URLs, or ML API URLs.

How it connects:

`app.js`, `server.js`, and `ml.service.js` use the exported `env` object.

Beginner mistake:

Reading `process.env` everywhere makes configuration messy and harder to validate.

### `src/routes/upload.routes.js`

Defines upload-related routes.

Current route:

```txt
POST /api/upload/analyze
```

How it connects:

It runs `uploadSingleFile` first, then `analyzeUpload`.

Beginner mistake:

Putting route logic directly in the route file makes the file grow too large.

### `src/middleware/upload.js`

Configures Multer.

What it does:

- Saves uploaded files to `uploads/`.
- Allows one file in the field named `file`.
- Restricts file types.
- Restricts file size.
- Renames files safely.

How it connects:

`upload.routes.js` uses it before the controller.

Beginner mistake:

Trusting the original filename. User-provided filenames can be unsafe or duplicated.

### `src/controllers/upload.controller.js`

Controls the upload request.

What it does:

1. Checks if a file exists.
2. Stores the temp file path.
3. Sends the file to the ML service.
4. Handles JSON response.
5. Handles PDF response.
6. Deletes the temp file in `finally`.

Why `finally` matters:

It runs after success and after errors, so temp files do not pile up on the server.

Beginner mistake:

Deleting the file only after success. If the ML API fails, the file would remain on disk.

### `src/services/ml.service.js`

Talks to the external ML API.

What it does:

- Creates a `FormData` request.
- Adds the uploaded file as a readable stream.
- Sends the request with Axios.
- Returns the ML API response stream and headers.

How it connects:

The controller calls `sendToMlApi`.

Beginner mistake:

Using browser `FormData` in Node.js. This project uses the `form-data` package because the request is sent from Node.

### `src/utils/fileCleanup.js`

Deletes temp files.

What it does:

Uses `fs.promises.unlink` safely and ignores `ENOENT` errors when the file is already gone.

Beginner mistake:

Throwing a new error during cleanup can hide the real ML API error.

### `src/utils/asyncHandler.js`

Wraps async route handlers.

Why it exists:

If an async controller throws, Express should pass the error to `errorHandler`.

Beginner mistake:

Forgetting to catch async errors can crash the request or leave the client hanging.

### `src/middleware/errorHandler.js`

Returns clean error responses.

What it does:

- Deletes uploaded files if Multer already saved them.
- Converts Multer errors into readable messages.
- Sends JSON error responses.

Beginner mistake:

Sending raw internal errors to users in production.

### `src/middleware/notFound.js`

Handles unknown routes.

What it does:

Creates a 404 error and sends it to the central error handler.

Beginner mistake:

Letting unknown routes return confusing default HTML responses.

## React Example: Upload File And Body Data

```jsx
import { useState } from "react";

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [reportType, setReportType] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patientName", patientName);
      formData.append("age", age);
      formData.append("reportType", reportType);
      formData.append("notes", notes);

      const response = await fetch("http://localhost:5000/api/upload/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setResult(data.data);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" onChange={(event) => setFile(event.target.files[0])} />
      <input value={patientName} onChange={(event) => setPatientName(event.target.value)} placeholder="Patient name" />
      <input value={age} onChange={(event) => setAge(event.target.value)} placeholder="Age" />
      <input value={reportType} onChange={(event) => setReportType(event.target.value)} placeholder="Report type" />
      <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes" />
      <button type="submit" disabled={loading || !file}>
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {error && <p>{error}</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </form>
  );
}
```

Important:

Do not manually set the `Content-Type` header. The browser sets the correct multipart boundary automatically.

## React Example: Download PDF Response

Use this when the ML API returns a PDF through the backend.

```jsx
async function analyzeAndDownloadPdf({ file, patientName, age, reportType, notes }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("patientName", patientName);
  formData.append("age", age);
  formData.append("reportType", reportType);
  formData.append("notes", notes);

  const response = await fetch("http://localhost:5000/api/upload/analyze", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "PDF download failed");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "ml-result.pdf";
  link.click();

  window.URL.revokeObjectURL(url);
}
```

## Test With cURL

```bash
curl -X POST http://localhost:5000/api/upload/analyze \
  -F "file=@sample.pdf" \
  -F "patientName=John Doe" \
  -F "age=32" \
  -F "reportType=XRay" \
  -F "notes=Chest scan"
```

On Windows PowerShell, use:

```powershell
curl.exe -X POST http://localhost:5000/api/upload/analyze `
  -F "file=@sample.pdf" `
  -F "patientName=John Doe" `
  -F "age=32" `
  -F "reportType=XRay" `
  -F "notes=Chest scan"
```

## Deployment On Render

Recommended Render settings:

```txt
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

Environment variables on Render:

```env
PORT=5000
CLIENT_URL=https://your-frontend-domain.com
ML_API_URL=https://your-real-ml-api.com
NODE_ENV=production
```

After backend deployment, update the frontend API URL:

```txt
https://your-render-backend.onrender.com/api/upload/analyze
```

## Connecting Frontend After Deploy

Local frontend:

```txt
http://localhost:3000
```

Local backend:

```txt
http://localhost:5000
```

Deployed frontend:

```txt
https://your-frontend-domain.com
```

Deployed backend:

```txt
https://your-render-backend.onrender.com
```

Make sure `CLIENT_URL` in the backend exactly matches the deployed frontend URL.

## Common Production Improvements

- Add authentication.
- Add per-user rate limits.
- Add request IDs for debugging.
- Add structured logging.
- Add file signature validation, not only MIME validation.
- Add virus scanning for uploaded files.
- Add retries for temporary ML API failures.
- Add monitoring and alerts.
- Store long-running ML jobs in a queue.
- Use cloud object storage for very large files.

## Scaling For Large Files

For small or medium files, temporary disk storage is fine.

For large files:

- Upload directly to S3, Cloudflare R2, or Google Cloud Storage.
- Send the storage URL to the ML API instead of streaming through Express.
- Use a background queue such as BullMQ, RabbitMQ, or SQS.
- Return a job ID immediately.
- Let the frontend poll or subscribe for completion.
- Avoid buffering large files in memory.

## Quick Debug Checklist

- Backend server is running.
- `.env` exists in `backend/`.
- `ML_API_URL` is correct.
- Frontend uses `FormData`.
- Frontend field name is exactly `file`.
- Frontend does not manually set multipart `Content-Type`.
- Uploaded file MIME type is allowed.
- File size is below the configured limit.
- `CLIENT_URL` matches the frontend origin.
