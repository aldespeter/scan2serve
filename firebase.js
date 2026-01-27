
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBwNWBrP56OBrVwRnqLLVahyelUe4a6bBk",
    authDomain: "scan2serve-cfb09.firebaseapp.com",
    projectId: "scan2serve-cfb09",
    storageBucket: "scan2serve-cfb09.firebasestorage.app",
    messagingSenderId: "165334113772",
    appId: "1:165334113772:web:449be92a52ce4e399c34c9"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  export const db = getFirestore(app);