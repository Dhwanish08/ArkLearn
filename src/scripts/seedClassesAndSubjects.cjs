const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

admin.initializeApp({
  credential: applicationDefault(),
});
const firestore = getFirestore();

// 1. Global subjects
const subjects = [
  { code: "GUJ", name: "Gujarati" },
  { code: "MATH", name: "Mathematics" },
  { code: "ENG", name: "English" },
  { code: "EVS", name: "Environmental Studies" },
  { code: "HIN", name: "Hindi" },
  { code: "SCI", name: "Science" },
  { code: "SOCSCI", name: "Social Science" },
  { code: "SANS", name: "Sanskrit" },
  { code: "PHY", name: "Physics" },
  { code: "CHEM", name: "Chemistry" },
  { code: "BIO", name: "Biology" },
  { code: "COMP", name: "Computer Science" },
  { code: "ACC", name: "Accountancy" },
  { code: "BST", name: "Business Studies" },
  { code: "ECO", name: "Economics" },
  { code: "STAT", name: "Statistics" },
];

// 2. Classes and their subject arrays
const classSubjects = {};

// 1 & 2
[1, 2].forEach(std => {
  ["A", "B"].forEach(div => {
    classSubjects[`${std}-${div}`] = ["GUJ", "MATH", "ENG"];
  });
});
// 3 to 5
[3, 4, 5].forEach(std => {
  ["A", "B"].forEach(div => {
    classSubjects[`${std}-${div}`] = ["GUJ", "MATH", "ENG", "EVS"];
  });
});
// 6 to 8
[6, 7, 8].forEach(std => {
  ["A", "B"].forEach(div => {
    classSubjects[`${std}-${div}`] = ["GUJ", "ENG", "HIN", "MATH", "SCI", "SOCSCI", "SANS"];
  });
});
// 9 & 10
[9, 10].forEach(std => {
  ["A", "B"].forEach(div => {
    classSubjects[`${std}-${div}`] = ["GUJ", "ENG", "MATH", "SCI", "SOCSCI", "HIN", "SANS"];
  });
});
// 11 & 12 Science
[11, 12].forEach(std => {
  classSubjects[`${std}-SCI`] = ["PHY", "CHEM", "ENG", "MATH", "BIO", "COMP"];
});
// 11 & 12 Commerce
[11, 12].forEach(std => {
  classSubjects[`${std}-COM`] = ["ACC", "BST", "ECO", "STAT", "ENG", "COMP"];
});

async function seedSubjects() {
  for (const subj of subjects) {
    await firestore.collection("subjects").doc(subj.code).set(subj);
    console.log(`Added subject: ${subj.name}`);
  }
}

async function seedClasses() {
  for (const [className, subjectCodes] of Object.entries(classSubjects)) {
    await firestore.collection("classes").doc(className).set({
      name: className,
      subjects: subjectCodes,
    });
    console.log(`Added class: ${className}`);
  }
}

async function main() {
  await seedSubjects();
  await seedClasses();
  console.log("Seeding complete.");
  process.exit(0);
}

main(); 