import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth } from "firebase/auth";
import app from "../firebase/Config";
import {
  getFirestore,
  doc,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";

const LikeArticle = ({ id, likes }) => {
  const db = getFirestore(app);
  const auth = getAuth(app);
  const [user] = useAuthState(auth);

  const likesRef = doc(db, "Articles", id);

  const handleLike = () => {
    if (likes?.includes(user.uid)) {
      updateDoc(likesRef, {
        likes: arrayRemove(user.uid),
      })
        .then(() => {
          console.log("unliked");
        })
        .catch((e) => {
          console.log(e);
        });
    } else {
      updateDoc(likesRef, {
        likes: arrayUnion(user.uid),
      })
        .then(() => {
          console.log("liked");
        })
        .catch((e) => {
          console.log(e);
        });
    }
  };

  return (
    <div>
      <i
        className={`fa fa-heart${!likes?.includes(user.uid) ? "-o" : ""} fa-lg`}
        style={{
          cursor: "pointer",
          color: likes?.includes(user.uid) ? "red" : null,
        }}
        onClick={handleLike}
      />
    </div>
  );
};

export default LikeArticle;
