import { deleteDoc, doc, getFirestore } from "firebase/firestore";
import { getStorage, deleteObject, ref } from "firebase/storage";
import React from "react";
import { toast } from "react-toastify";
import app from "../firebase/Config";

const DeleteArticle = ({ id, imageUrl }) => {
  const db = getFirestore(app);
  const storage = getStorage(app);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this article?")) {
      await deleteDoc(doc(db, "Articles", id));
      toast("Article delected successfully", { type: "success" });
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
    }
  };

  return (
    <div>
      <i
        className="fa fa-times"
        onClick={handleDelete}
        style={{ cursor: "pointer" }}
      />
    </div>
  );
};

export default DeleteArticle;
