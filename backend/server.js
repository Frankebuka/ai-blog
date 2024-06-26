import express from "express";
import ytdl from "ytdl-core";
import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";
import { PassThrough } from "stream";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { fileTypeFromBuffer } from "file-type";
import path from "path";

dotenv.config();

const app = express();

app.use(express.json());

const __dirname = path.resolve();
const PORT = process.env.PORT;

app.use(express.static(path.join(__dirname, "/client/build")));

app.get("/download", async (req, res) => {
  const { url } = req.query;

  try {
    if (!ytdl.validateURL(url)) {
      throw new Error("Invalid YouTube URL");
    }

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;
    const thumbnails = info.videoDetails.thumbnails;
    const thumbnailUrl = thumbnails[thumbnails.length - 1].url;

    // Download the audio
    const audioStream = ytdl(url, { filter: "audioonly" });
    const audioBuffer = await streamToBuffer(audioStream);

    // Detect the file type
    const type = await fileTypeFromBuffer(audioBuffer);

    // If the file type is not audio, re-encode it to MP3
    if (!type.mime.startsWith("audio/")) {
      const mp3Buffer = await reencodeToMP3(audioBuffer);
      const mp3Type = await fileTypeFromBuffer(mp3Buffer);

      if (mp3Type.mime !== "audio/mpeg") {
        throw new Error("Invalid audio file type after re-encoding");
      }

      const assemblyResponse = await sendToAssemblyAI(mp3Buffer, mp3Type);
      const transcriptId = assemblyResponse.data.id;

      const transcription = await getTranscription(transcriptId);

      res.json({
        title,
        thumbnailUrl,
        text: transcription.text,
      });
    } else {
      const assemblyResponse = await sendToAssemblyAI(audioBuffer, type);
      const transcriptId = assemblyResponse.data.id;

      const transcription = await getTranscription(transcriptId);

      res.json({
        title,
        thumbnailUrl,
        text: transcription.text,
      });
    }
  } catch (error) {
    console.error("Error downloading audio:", error.message);
    res.status(500).send("Error downloading audio");
  }
});

const streamToBuffer = (stream) => {
  return new Promise((resolve, reject) => {
    const bufferArray = [];
    stream.on("data", (chunk) => bufferArray.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(bufferArray)));
    stream.on("error", reject);
  });
};

// Set ffmpeg path from ffmpeg-static
ffmpeg.setFfmpegPath(ffmpegStatic);

const reencodeToMP3 = (inputBuffer) => {
  return new Promise((resolve, reject) => {
    const outputStream = new PassThrough();
    const chunks = [];

    ffmpeg()
      .input(new PassThrough().end(inputBuffer))
      .outputFormat("mp3")
      .on("error", reject)
      .on("end", () => resolve(Buffer.concat(chunks)))
      .pipe(outputStream);

    outputStream.on("data", (chunk) => chunks.push(chunk));
    outputStream.on("end", () => resolve(Buffer.concat(chunks)));
  });
};

const sendToAssemblyAI = async (audioBuffer, type) => {
  const formData = new FormData();
  formData.append("audio", audioBuffer, {
    filename: "audio.mp3",
    contentType: type.mime,
  });

  const uploadResponse = await axios.post(
    "https://api.assemblyai.com/v2/upload",
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        authorization: process.env.ASSEMBLYAI_API_KEY,
      },
    }
  );

  const audioUrl = uploadResponse.data.upload_url;

  const transcriptionResponse = await axios.post(
    "https://api.assemblyai.com/v2/transcript",
    {
      audio_url: audioUrl,
    },
    {
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY,
      },
    }
  );

  return transcriptionResponse;
};

const getTranscription = async (transcriptId) => {
  let status = "processing";
  let transcription = null;

  while (status === "processing" || status === "queued") {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const response = await axios.get(
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      {
        headers: {
          authorization: process.env.ASSEMBLYAI_API_KEY,
        },
      }
    );

    status = response.data.status;
    transcription = response.data;

    if (status === "error") {
      console.error("Transcription error details:", transcription);
      throw new Error("Transcription failed");
    }
  }

  if (status === "completed") {
    return transcription;
  } else {
    throw new Error("Transcription failed");
  }
};

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// import express from "express";
// import ytdl from "ytdl-core";
// import axios from "axios";
// import FormData from "form-data";
// import dotenv from "dotenv";
// import { PassThrough } from "stream";
// import ffmpeg from "fluent-ffmpeg";
// import ffmpegStatic from "ffmpeg-static";
// import { fileTypeFromBuffer } from "file-type";
// import path from "path";
// import fs from "fs";
// import { exec } from "child_process";

// dotenv.config();

// const app = express();

// app.use(express.json());

// const __dirname = path.resolve();
// app.use(express.static(path.join(__dirname, "/client/build")));

// // Set ffmpeg path from ffmpeg-static
// ffmpeg.setFfmpegPath(ffmpegStatic);

// // Helper function to convert stream to buffer
// const streamToBuffer = (stream) => {
//   return new Promise((resolve, reject) => {
//     const bufferArray = [];
//     stream.on("data", (chunk) => bufferArray.push(chunk));
//     stream.on("end", () => resolve(Buffer.concat(bufferArray)));
//     stream.on("error", reject);
//   });
// };

// // Re-encode audio buffer to MP3 format
// const reencodeToMP3 = (inputBuffer) => {
//   return new Promise((resolve, reject) => {
//     const tempFilePath = path.join("/tmp", "tempfile.webm"); // Use /tmp instead of os.tmpdir()
//     fs.writeFile(tempFilePath, inputBuffer, (err) => {
//       if (err) {
//         return reject(new Error(`Error writing temp file: ${err.message}`));
//       }

//       const outputStream = new PassThrough();
//       const chunks = [];

//       ffmpeg(tempFilePath)
//         .inputFormat("webm")
//         .outputFormat("mp3")
//         .on("start", (cmdline) => {
//           console.log(`Started ffmpeg with command: ${cmdline}`);
//         })
//         .on("progress", (progress) => {
//           console.log(`Processing: ${progress.timemark}`);
//         })
//         .on("error", (err, stdout, stderr) => {
//           console.error(`ffmpeg error: ${err.message}`);
//           console.error(`ffmpeg stdout: ${stdout}`);
//           console.error(`ffmpeg stderr: ${stderr}`);
//           fs.unlink(tempFilePath, () => {
//             reject(new Error(`ffmpeg exited with code ${err.code}`));
//           });
//         })
//         .on("end", () => {
//           console.log("ffmpeg finished processing");
//           fs.unlink(tempFilePath, () => {
//             resolve(Buffer.concat(chunks));
//           });
//         })
//         .pipe(outputStream);

//       outputStream.on("data", (chunk) => chunks.push(chunk));
//       outputStream.on("error", (err) => {
//         reject(new Error(`Output stream error: ${err.message}`));
//       });
//       outputStream.on("end", () => {
//         resolve(Buffer.concat(chunks));
//       });
//     });
//   });
// };

// // Send audio buffer to AssemblyAI for transcription
// const sendToAssemblyAI = async (audioBuffer, type) => {
//   const formData = new FormData();
//   formData.append("audio", audioBuffer, {
//     filename: "audio.mp3",
//     contentType: type.mime,
//   });

//   const uploadResponse = await axios.post(
//     "https://api.assemblyai.com/v2/upload",
//     formData,
//     {
//       headers: {
//         ...formData.getHeaders(),
//         authorization: process.env.ASSEMBLYAI_API_KEY, // Use environment variable for API key
//       },
//     }
//   );

//   const audioUrl = uploadResponse.data.upload_url;

//   const transcriptionResponse = await axios.post(
//     "https://api.assemblyai.com/v2/transcript",
//     {
//       audio_url: audioUrl,
//     },
//     {
//       headers: {
//         authorization: process.env.ASSEMBLYAI_API_KEY, // Use environment variable for API key
//       },
//     }
//   );

//   return transcriptionResponse;
// };

// // Get transcription result from AssemblyAI
// const getTranscription = async (transcriptId) => {
//   let status = "processing";
//   let transcription = null;

//   while (status === "processing" || status === "queued") {
//     await new Promise((resolve) => setTimeout(resolve, 5000));

//     const response = await axios.get(
//       `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
//       {
//         headers: {
//           authorization: process.env.ASSEMBLYAI_API_KEY, // Use environment variable for API key
//         },
//       }
//     );

//     status = response.data.status;
//     transcription = response.data;

//     if (status === "error") {
//       console.error("Transcription error details:", transcription);
//       throw new Error("Transcription failed");
//     }
//   }

//   if (status === "completed") {
//     return transcription;
//   } else {
//     throw new Error("Transcription failed");
//   }
// };

// // Endpoint to download and process YouTube audio
// app.get("/download", async (req, res) => {
//   const { url } = req.query;

//   try {
//     if (!ytdl.validateURL(url)) {
//       throw new Error("Invalid YouTube URL");
//     }

//     const info = await ytdl.getInfo(url);
//     const title = info.videoDetails.title;
//     const thumbnails = info.videoDetails.thumbnails;
//     const thumbnailUrl = thumbnails[thumbnails.length - 1].url;

//     const audioStream = ytdl(url, { filter: "audioonly" });
//     const audioBuffer = await streamToBuffer(audioStream);
//     console.log("Audio Buffer Length:", audioBuffer.length);

//     const type = await fileTypeFromBuffer(audioBuffer);
//     console.log("Detected File Type:", type);

//     if (!type.mime.startsWith("audio/")) {
//       const mp3Buffer = await reencodeToMP3(audioBuffer);
//       const mp3Type = await fileTypeFromBuffer(mp3Buffer);
//       console.log("Re-encoded MP3 Buffer Length:", mp3Buffer.length);
//       console.log("Re-encoded MP3 Type:", mp3Type);

//       if (mp3Type.mime !== "audio/mpeg") {
//         throw new Error("Invalid audio file type after re-encoding");
//       }

//       const assemblyResponse = await sendToAssemblyAI(mp3Buffer, mp3Type);
//       console.log("AssemblyAI Response:", assemblyResponse);
//       const transcriptId = assemblyResponse.data.id;

//       const transcription = await getTranscription(transcriptId);
//       console.log("Transcription:", transcription);

//       res.json({
//         title,
//         thumbnailUrl,
//         text: transcription.text,
//       });
//     } else {
//       const assemblyResponse = await sendToAssemblyAI(audioBuffer, type);
//       console.log("AssemblyAI Response:", assemblyResponse);
//       const transcriptId = assemblyResponse.data.id;

//       const transcription = await getTranscription(transcriptId);
//       console.log("Transcription:", transcription);

//       res.json({
//         title,
//         thumbnailUrl,
//         text: transcription.text,
//       });
//     }
//   } catch (error) {
//     console.error("Error downloading audio:", error.message);
//     res.status(500).send("Error downloading audio");
//   }
// });

// // Endpoint to get ffmpeg version
// app.get("/ffmpeg-version", (req, res) => {
//   exec("ffmpeg -version", (error, stdout, stderr) => {
//     if (error) {
//       return res.status(500).send(`ffmpeg error: ${error.message}`);
//     }
//     if (stderr) {
//       return res.status(500).send(`ffmpeg stderr: ${stderr}`);
//     }
//     res.send(`ffmpeg stdout: ${stdout}`);
//   });
// });

// // Serve client build files
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "client", "build", "index.html"));
// });

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
