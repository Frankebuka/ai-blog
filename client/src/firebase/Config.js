import { initializeApp } from "firebase/app";
const firebaseConfig = {
  apiKey: "AIzaSyBeGAbrOTboQ-LZ-Ip4C710CSJy6QcTwyw",
  authDomain: "blog-post-firebase.firebaseapp.com",
  projectId: "blog-post-firebase",
  storageBucket: "blog-post-firebase.appspot.com",
  messagingSenderId: "353085310257",
  appId: "1:353085310257:web:a7aca2e3d2d724cf0b9c10",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;
