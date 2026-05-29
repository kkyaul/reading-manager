// ============================================================
// firebase.js — Firebase 초기화 + Firestore / Storage 함수
// ============================================================
// ← 아래 값을 Firebase 콘솔에서 복사한 값으로 교체하세요
const firebaseConfig = {
  apiKey:            "AIzaSyAVxGOB8eI5wZ4Ecav86f0pcbLY2mh87V0",
  authDomain:        "readlog-c0280.firebaseapp.com",
  projectId:         "readlog-c0280",
  storageBucket:     "readlog-c0280.firebasestorage.app",
  messagingSenderId: "1031017799552",
  appId:             "1:1031017799552:web:910b49e6fc71a90f542b65"
};

// ── Firebase SDK 초기화 ──────────────────────────────────────
import { initializeApp }                         from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
                                                 from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, doc,
         addDoc, setDoc, getDoc, getDocs,
         updateDoc, deleteDoc, query,
         where, orderBy, serverTimestamp }        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject }
                                                 from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const stor = getStorage(app);

// ── Auth ─────────────────────────────────────────────────────
export const googleProvider = new GoogleAuthProvider();

export const login  = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
export const onAuth = (cb) => onAuthStateChanged(auth, cb);

// ── Firestore 컬렉션 참조 ─────────────────────────────────────
// books/{bookId}
//   title, author, genre, startDate, endDate, score, media,
//   readingDays, round, stopped, memo, imageUrl, createdAt
//
// books/{bookId}/quotes/{quoteId}
//   text, thought, date, createdAt
//
// books/{bookId}/summary (단일 문서)
//   content, updatedAt
//
// dailyRecords/{date}  (date: "YYYY-MM-DD")
//   entries: [{ title, status, page }]

const booksCol = () => collection(db, "books");
const bookDoc  = (id) => doc(db, "books", id);
const quotesCol= (bookId) => collection(db, "books", bookId, "quotes");
const quoteDoc = (bookId, quoteId) => doc(db, "books", bookId, "quotes", quoteId);
const summaryDoc=(bookId) => doc(db, "books", bookId, "summary", "main");
const dailyDoc = (date)   => doc(db, "dailyRecords", date);

// ── Books ────────────────────────────────────────────────────
export async function addBook(data) {
  return await addDoc(booksCol(), { ...data, createdAt: serverTimestamp() });
}
export async function updateBook(id, data) {
  return await updateDoc(bookDoc(id), data);
}
export async function getBook(id) {
  const snap = await getDoc(bookDoc(id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
export async function getAllBooks() {
  const snap = await getDocs(query(booksCol(), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function deleteBook(id) {
  return await deleteDoc(bookDoc(id));
}

// ── Quotes ───────────────────────────────────────────────────
export async function addQuote(bookId, data) {
  return await addDoc(quotesCol(bookId), { ...data, createdAt: serverTimestamp() });
}
export async function getQuotes(bookId) {
  const snap = await getDocs(query(quotesCol(bookId), orderBy("createdAt", "asc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function updateQuote(bookId, quoteId, data) {
  return await updateDoc(quoteDoc(bookId, quoteId), data);
}
export async function deleteQuote(bookId, quoteId) {
  return await deleteDoc(quoteDoc(bookId, quoteId));
}

// ── Summary ──────────────────────────────────────────────────
export async function setSummary(bookId, content) {
  return await setDoc(summaryDoc(bookId), { content, updatedAt: serverTimestamp() });
}
export async function getSummary(bookId) {
  const snap = await getDoc(summaryDoc(bookId));
  return snap.exists() ? snap.data().content : "";
}

// ── Daily Records ────────────────────────────────────────────
export async function getDailyRecord(date) {
  const snap = await getDoc(dailyDoc(date));
  return snap.exists() ? snap.data() : { entries: [] };
}
export async function setDailyRecord(date, entries) {
  return await setDoc(dailyDoc(date), { entries });
}
export async function getDailyRange(from, to) {
  // from, to: "YYYY-MM-DD"
  const snap = await getDocs(
    query(collection(db, "dailyRecords"),
          where("__name__", ">=", from),
          where("__name__", "<=", to))
  );
  const result = {};
  snap.docs.forEach(d => { result[d.id] = d.data(); });
  return result;
}

// ── Storage: 책표지 업로드 ────────────────────────────────────
export async function uploadCover(bookId, file) {
  const r   = ref(stor, `covers/${bookId}`);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}
export async function deleteCover(bookId) {
  try { await deleteObject(ref(stor, `covers/${bookId}`)); } catch (_) {}
}