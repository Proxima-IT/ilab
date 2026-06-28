export const student = {
  name: "Rahim Hossain",
  avatar: "https://placehold.co/96x96/F0FDFA/0D9488?text=RH",
  level: 7,
  levelName: "Explorer",
  xp: 780,
  xpMax: 1000,
  streak: 7,
  maxStreak: 21,
  totalStudyDays: 45,
  certificates: 2,
  enrolledCourses: 6,
  overallProgress: 47,
  email: "rahim@email.com",
  phone: "+880 1712 345678",
  location: "Dhaka, Bangladesh",
};

export const courses = [
  { id: 1, slug: "python", title: "Python Programming", instructor: "Sabbir Hossain", progress: 100, lectures: [30, 30], hoursSpent: 24, lastWatched: "15 March", color: "#0D9488" },
  { id: 2, slug: "react", title: "React.js Mastery", instructor: "Sabbir Hossain", progress: 68, lectures: [16, 30], hoursSpent: 12, lastWatched: "Ajke", color: "#0D9488" },
  { id: 3, slug: "uiux", title: "UI/UX Design", instructor: "Nadia Rahman", progress: 40, lectures: [8, 20], hoursSpent: 6, lastWatched: "2 din age", color: "#F76A21" },
  { id: 4, slug: "datascience", title: "Data Science", instructor: "Karim Ahmed", progress: 25, lectures: [5, 20], hoursSpent: 4, lastWatched: "5 din age", color: "#0F766E" },
  { id: 5, slug: "nextjs", title: "Next.js Full-Stack", instructor: "Tanvir Hasan", progress: 10, lectures: [2, 25], hoursSpent: 2, lastWatched: "1 week age", color: "#14B8A6" },
  { id: 6, slug: "marketing", title: "Digital Marketing", instructor: "Sadia Islam", progress: 5, lectures: [1, 20], hoursSpent: 1, lastWatched: "2 weeks age", color: "#FF8A4C" },
];

export const curriculum = [
  {
    id: 1, title: "Module 1: React Fundamentals", completed: true,
    lectures: [
      { id: "1.1", title: "React ki?", duration: "12:34", completed: true },
      { id: "1.2", title: "JSX Basics", duration: "08:21", completed: true },
      { id: "1.3", title: "Components", duration: "15:05", completed: true },
    ]
  },
  {
    id: 2, title: "Module 2: Styling", completed: true,
    lectures: [
      { id: "2.1", title: "CSS Modules", duration: "11:20", completed: true },
      { id: "2.2", title: "Tailwind CSS", duration: "14:35", completed: true },
    ]
  },
  {
    id: 3, title: "Module 3: Hooks", completed: false,
    lectures: [
      { id: "3.1", title: "useState", duration: "18:45", completed: true },
      { id: "3.2", title: "useEffect", duration: "22:10", completed: true },
      { id: "3.3", title: "useRef", duration: "14:30", completed: true },
      { id: "3.4", title: "useContext & Global State", duration: "23:15", completed: false, current: true },
      { id: "3.5", title: "Custom Hooks", duration: "19:50", completed: false, locked: true },
    ]
  },
  {
    id: 4, title: "Module 4: Advanced Patterns", completed: false,
    lectures: [
      { id: "4.1", title: "Higher Order Components", duration: "20:00", completed: false, locked: true },
      { id: "4.2", title: "Render Props", duration: "16:45", completed: false, locked: true },
    ]
  },
];

export const weeklyActivity = [
  [10, 45, 60, 30, 0, 90, 20],
  [35, 70, 50, 0, 55, 80, 45],
  [20, 40, 75, 60, 30, 0, 65],
  [50, 25, 0, 45, 80, 55, 30],
];

export const analyticsData = [
  { day: 0, minutes: 45 },
  { day: 1, minutes: 30 },
  { day: 2, minutes: 60 },
  { day: 3, minutes: 90 },
  { day: 4, minutes: 20 },
  { day: 5, minutes: 75 },
  { day: 6, minutes: 40 },
];

export const quizData = [
  { name: "Quiz 1", score: 85 },
  { name: "Quiz 2", score: 72 },
  { name: "Quiz 3", score: 96 },
  { name: "Quiz 4", score: 68 },
  { name: "Quiz 5", score: 78 },
  { name: "Quiz 6", score: 82 },
  { name: "Quiz 7", score: 90 },
  { name: "Quiz 8", score: 55 },
  { name: "Quiz 9", score: 74 },
  { name: "Quiz 10", score: 88 },
];

export const studyTimeData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  actual: Math.floor(Math.random() * 60 + 15),
  target: 45,
}));

export const liveSessions = [
  { id: 1, title: "React Q&A — Sabbir Sir", date: "28 March, 7:00 PM", daysLeft: 3 },
  { id: 2, title: "Python Project Review", date: "1 April, 8:00 PM", daysLeft: 7 },
  { id: 3, title: "Career Guidance Session", date: "5 April, 6:00 PM", daysLeft: 11 },
];

export const achievementsList = [
  { id: 1, icon: "trophy", title: "First Course", earned: true },
  { id: 2, icon: "flame", title: "7 Day Streak", earned: true },
  { id: 3, icon: "zap", title: "Fast Learner", earned: false, condition: "Ekdin e 5ta lecture complete koro" },
  { id: 4, icon: "star", title: "Top 10%", earned: false, condition: "Leaderboard e Top 10% e jao" },
  { id: 5, icon: "target", title: "Project Master", earned: false, condition: "30 din streak complete koro" },
];

export const leaderboardData = [
  { rank: 1, name: "Rahela Akter", xp: 2450, courses: 5, streak: 21, change: 0 },
  { rank: 2, name: "Karim Hossain", xp: 1980, courses: 4, streak: 14, change: 1 },
  { rank: 3, name: "Sumaiya Islam", xp: 1740, courses: 4, streak: 10, change: -1 },
  { rank: 4, name: "Tanvir Ahmed", xp: 1520, courses: 3, streak: 8, change: 2 },
  { rank: 5, name: "Nusrat Jahan", xp: 1350, courses: 3, streak: 12, change: 0 },
  { rank: 6, name: "Fahim Rahman", xp: 1200, courses: 3, streak: 5, change: -2 },
  { rank: 7, name: "Mithila Das", xp: 1100, courses: 2, streak: 9, change: 3 },
  { rank: 8, name: "Arif Hasan", xp: 980, courses: 2, streak: 6, change: 0 },
  { rank: 9, name: "Tasnim Akter", xp: 890, courses: 2, streak: 4, change: -1 },
  { rank: 10, name: "Rahim Hossain", xp: 780, courses: 2, streak: 7, change: 3, isStudent: true },
];

export const resourcesData = [
  { id: 1, title: "Python Cheatsheet v2", course: "Python Programming", type: "pdf", size: "2.4 MB" },
  { id: 2, title: "React Hooks Guide", course: "React.js Mastery", type: "pdf", size: "1.8 MB" },
  { id: 3, title: "Lecture 3.4 Code", course: "React.js Mastery", type: "code", size: "340 KB" },
  { id: 4, title: "UI/UX Roadmap 2025", course: "UI/UX Design", type: "roadmap", size: "5.2 MB" },
  { id: 5, title: "Data Science Cheatsheet", course: "Data Science", type: "cheatsheet", size: "1.1 MB" },
  { id: 6, title: "MDN Docs — useState", course: "React.js Mastery", type: "link", size: "" },
  { id: 7, title: "Python Project Files", course: "Python Programming", type: "code", size: "12 MB" },
  { id: 8, title: "Figma Tutorial Video", course: "UI/UX Design", type: "video", size: "" },
];

export const mockQA = [
  {
    id: 1,
    question: "useContext ar prop drilling er moddhe ki difference?",
    author: "Nusrat J.",
    answer: "useContext component tree diye data pass korar ekta way provide kore, protita level e manually props pass kora chara.",
    upvotes: 12,
    time: "2h age"
  },
  {
    id: 2,
    question: "Kokhon useState er bodole useReducer use korbo?",
    author: "Karim H.",
    answer: "Jokhon complex state logic thake jekhane multiple sub-values joriyo ba jokhon next state previous state er upor depend kore tokhon useReducer use kora valo.",
    upvotes: 8,
    time: "5h age"
  },
];

export const notificationsData = [
  { id: 1, text: "Notun lecture add hoyeche — React.js Module 3", type: "info", time: "2m age" },
  { id: 2, text: "Tomar certificate ready!", type: "success", time: "1h age" },
  { id: 3, text: "Live Q&A 30 minute e start hobe", type: "warning", time: "28m age" },
];
