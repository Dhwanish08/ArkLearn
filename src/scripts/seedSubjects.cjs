const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBk6vjjq5VGVXYUcpsONsNah07tkMl2fQc",
  authDomain: "eduai-466305.firebaseapp.com",
  projectId: "eduai-466305",
  storageBucket: "eduai-466305.appspot.com",
  messagingSenderId: "220718266197",
  appId: "1:220718266197:web:bfed8eac0ec1ef6a0b61dc",
  measurementId: "G-96H84EZN7S"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

async function seedSubjects() {
  const classId = "9-A";
  const teacherId = "sample-teacher-uid";
  const teacherName = "Sample Teacher";
  for (let i = 1; i <= 8; i++) {
    await addDoc(collection(firestore, "subjects"), {
      name: `Subject-${i}`,
      class: classId,
      teacherId,
      teacherName,
      code: `SUBJ${i}`
    });
    console.log(`Added Subject-${i}`);
  }
  console.log("Seeding complete.");
}

seedSubjects(); 