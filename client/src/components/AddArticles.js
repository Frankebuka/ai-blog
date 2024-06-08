import {
  collection,
  Timestamp,
  getFirestore,
  addDoc,
} from "firebase/firestore";
import {
  ref,
  getStorage,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import React, { useState } from "react";
import { toast } from "react-toastify";
import app from "../firebase/Config";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth } from "firebase/auth";

// prompt = f"Based on the following transcript from a YouTube video, write a comprehensive blog article, write it based on the transcript, but don't make it look like a youtube video, make it look like a proper blog article:\n\n{transcription}\n\nArticle:"

const AddArticles = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    createdAt: Timestamp.now().toDate(),
  });

  const [progress, setProgress] = useState(0);

  const storage = getStorage(app);
  const db = getFirestore(app);
  const auth = getAuth(app);
  const [user] = useAuthState(auth);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handlePublish = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.image) {
      alert("please fill all the fields");
      return;
    }

    const storageRef = ref(
      storage,
      `/images/${Date.now()}${formData.image.name}}`
    );

    const uploadImage = uploadBytesResumable(storageRef, formData.image);

    uploadImage.on(
      "state_changed",
      (snapshot) => {
        const progressPercent = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress(progressPercent);
      },
      (err) => {
        console.log(err);
      },
      () => {
        setFormData({
          title: "",
          description: "",
          image: "",
        });

        getDownloadURL(uploadImage.snapshot.ref).then((url) => {
          const articleRef = collection(db, "Articles");
          addDoc(articleRef, {
            title: formData.title,
            description: formData.description,
            imageUrl: url,
            createdAt: Timestamp.now().toDate(),
            createdBy: user.displayName,
            userId: user.uid,
            likes: [],
            comments: [],
          })
            .then(() => {
              toast("Article added successfully", { type: "success" });
              setProgress(0);
            })
            .catch((err) => {
              toast("Error adding article", { type: "error" });
            });
        });
      }
    );
  };

  return (
    <>
      {user && (
        <div className="border p-3 bg-light my-3">
          <h2>Create article</h2>
          <label htmlFor="">Title</label>
          <input
            type="text"
            name="title"
            className="form-control"
            value={formData.title}
            onChange={(e) => handleChange(e)}
          />

          {/* description */}
          <label htmlFor="">Description</label>
          <textarea
            name="description"
            className="form-control"
            value={formData.description}
            onChange={(e) => handleChange(e)}
          />

          {/* image */}
          <label htmlFor="">Image</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            className="form-control"
            onChange={(e) => handleImageChange(e)}
          />

          {/* progress bar */}
          {progress === 0 ? null : (
            <div className="progress">
              <div
                className="progress-bar progress-bar-striped mt-2"
                style={{ width: `${progress}%` }}
              >
                {`uploading image ${progress}%`}
              </div>
            </div>
          )}

          {/* button */}
          <button
            className="form-control btn-primary mt-2"
            onClick={handlePublish}
          >
            Publish
          </button>
        </div>
      )}
    </>
  );
};

export default AddArticles;
