import { Injectable } from "@angular/core";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { firebaseConfig } from "../../environments/firebase.config";

export interface ScoreEntry {
  name: string;
  score: number;
  date: string;
  correctAnswers: number;
  totalQuestions: number;
  timestamp: number;
}

@Injectable({
  providedIn: "root",
})
export class FirebaseService {
  private app;
  private db;

  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
  }

  async saveScore(scoreEntry: Omit<ScoreEntry, "timestamp">): Promise<void> {
    try {
      const scoreWithTimestamp: ScoreEntry = {
        ...scoreEntry,
        timestamp: Date.now(),
      };

      await addDoc(collection(this.db, "scores"), scoreWithTimestamp);
      console.log("ציון נשמר בהצלחה! 🎉");
    } catch (error) {
      console.error("שגיאה בשמירת הציון:", error);
      // Fallback to localStorage if Firebase fails
      this.saveToLocalStorage(scoreEntry);
    }
  }

  async getTopScores(): Promise<ScoreEntry[]> {
    try {
      const q = query(
        collection(this.db, "scores"),
        orderBy("score", "desc"),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const scores: ScoreEntry[] = [];

      querySnapshot.forEach((doc) => {
        scores.push(doc.data() as ScoreEntry);
      });

      return scores;
    } catch (error) {
      console.error("שגיאה בטעינת הציונים:", error);
      // Fallback to localStorage if Firebase fails
      return this.getFromLocalStorage();
    }
  }

  private saveToLocalStorage(scoreEntry: Omit<ScoreEntry, "timestamp">): void {
    const scores = this.getFromLocalStorage();
    const scoreWithTimestamp: ScoreEntry = {
      ...scoreEntry,
      timestamp: Date.now(),
    };

    scores.push(scoreWithTimestamp);
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, 10);

    localStorage.setItem(
      "multiplicationTableScores",
      JSON.stringify(topScores)
    );
  }

  private getFromLocalStorage(): ScoreEntry[] {
    const saved = localStorage.getItem("multiplicationTableScores");
    return saved ? JSON.parse(saved) : [];
  }
}
