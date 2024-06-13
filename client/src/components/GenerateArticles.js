import React, { useState } from "react";
import app from "../firebase/Config";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth } from "firebase/auth";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  collection,
  Timestamp,
  getFirestore,
  addDoc,
} from "firebase/firestore";
import axios from "axios";

const GenerateArticles = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = getAuth(app);
  const [user] = useAuthState(auth);
  const db = getFirestore(app);
  const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

  // const handleGenerate = async () => {
  //   if (!url) {
  //     alert("Please enter a YouTube URL");
  //     return;
  //   }
  //   setLoading(true);
  //   try {
  //     // // Test the ffmpeg re-encoding route
  //     // const testResponse = await fetch(
  //     //   `https://ai-blog-x3f1.onrender.com/ffmpeg-version`
  //     // );
  //     // if (!testResponse.ok) {
  //     //   throw new Error("Failed to test ffmpeg re-encoding");
  //     // }
  //     // const testData = await testResponse.text();
  //     // console.log("ffmpeg re-encoding test response:", testData);

  //     // Fetch data from the server
  //     const response = await fetch(
  //       `https://ai-blog-x3f1.onrender.com/download?url=${encodeURIComponent(
  //         url
  //       )}`
  //     );
  //     if (!response.ok) {
  //       throw new Error("Failed to fetch video data");
  //     }
  //     const data = await response.json();

  //     // Save article to Firestore db
  //     const articleRef = collection(db, "Articles");
  //     await addDoc(articleRef, {
  //       title: data.title,
  //       description: data.text,
  //       imageUrl: data.thumbnailUrl,
  //       createdAt: Timestamp.now().toDate(),
  //       createdBy: user.displayName,
  //       userId: user.uid,
  //       likes: [],
  //       comments: [],
  //     });
  //     toast("Article added successfully", { type: "success" });
  //     setUrl("");
  //   } catch (error) {
  //     console.error("Error generating article:", error.message);
  //     toast("Failed to generate article", { type: "error" });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleGenerate = async () => {
    if (!url) {
      alert("Please enter a YouTube URL");
      return;
    }
    setLoading(true);
    try {
      // Fetch data from youtube data api
      const videoId = getVideoIdFromUrl(url); // Function to extract video ID from URL
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos`,
        {
          params: {
            id: videoId,
            key: YOUTUBE_API_KEY,
            part: "snippet",
          },
        }
      );
      if (response.data.items && response.data.items.length > 0) {
        const snippet = response.data.items[0].snippet;
        const title = snippet.title;
        const thumbnails = snippet.thumbnails;
        const thumbnailUrl = thumbnails.high
          ? thumbnails.high.url
          : thumbnails.default.url;

        // Save article to Firestore db
        const articleRef = collection(db, "Articles");
        await addDoc(articleRef, {
          title,
          description: "Error: unable to transcript text",
          imageUrl: thumbnailUrl,
          createdAt: Timestamp.now().toDate(),
          createdBy: user.displayName,
          userId: user.uid,
          likes: [],
          comments: [],
        });
      } else {
        console.error("No video found for the provided link");
      }

      toast("Article added successfully", { type: "success" });
      setUrl("");
    } catch (error) {
      console.error("Error generating article:", error.message);
      toast("Failed to generate article", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const getVideoIdFromUrl = (url) => {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("v");
  };

  return (
    <div className="border p-3 mt-3 bg-light">
      {!user ? (
        <>
          <h2>
            <Link to="/login">Login to create article</Link>
          </h2>
          Don't have an account? <Link to="/register">Sign up</Link>
        </>
      ) : (
        <>
          <h2>Generate article</h2>
          <label htmlFor="" className="mb-1">
            Enter youtube video link
          </label>
          <input
            type="url"
            name="link"
            placeholder="Place Youtube Link..."
            className="form-control mb-4"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          {/* button */}
          <button
            className="form-control btn-primary mt-2"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Processing... please wait" : "Generate"}
          </button>
        </>
      )}
    </div>
  );
};

export default GenerateArticles;
