import { Injectable } from "@angular/core";

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
export class CloudStorageService {
  private readonly STORAGE_URL =
    "https://api.jsonbin.io/v3/b/67e3f8e5e41b4d34e4616c8a";
  private readonly API_KEY =
    "$2a$10$8vQZxjXjXjXjXjXjXjXjXOeKw8vQZxjXjXjXjXjXjXjXjXjXjXjXjX"; // Demo key

  constructor() {}

  async saveScore(scoreEntry: Omit<ScoreEntry, "timestamp">): Promise<void> {
    try {
      const scoreWithTimestamp: ScoreEntry = {
        ...scoreEntry,
        timestamp: Date.now(),
      };

      // Get current scores
      const currentScores = await this.getTopScores();

      // Add new score
      currentScores.push(scoreWithTimestamp);

      // Sort and keep top 10
      currentScores.sort((a, b) => b.score - a.score);
      const topScores = currentScores.slice(0, 10);

      // Save to cloud (fallback to localStorage if fails)
      try {
        await fetch(this.STORAGE_URL, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Master-Key": this.API_KEY,
          },
          body: JSON.stringify({ scores: topScores }),
        });
        console.log("ציון נשמר בענן! 🎉");
      } catch (error) {
        console.log("נשמר מקומית 💾");
        this.saveToLocalStorage(topScores);
      }
    } catch (error) {
      console.error("שגיאה בשמירת הציון:", error);
      // Fallback to localStorage
      const scoreWithTimestamp: ScoreEntry = {
        ...scoreEntry,
        timestamp: Date.now(),
      };
      this.saveToLocalStorage([scoreWithTimestamp]);
    }
  }

  async getTopScores(): Promise<ScoreEntry[]> {
    try {
      // Try to get from cloud first
      const response = await fetch(this.STORAGE_URL + "/latest", {
        headers: {
          "X-Master-Key": this.API_KEY,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.record?.scores || [];
      }
    } catch (error) {
      console.log("טוען מהמחשב המקומי...");
    }

    // Fallback to localStorage
    return this.getFromLocalStorage();
  }

  private saveToLocalStorage(scores: ScoreEntry[]): void {
    localStorage.setItem("multiplicationTableScores", JSON.stringify(scores));
  }

  private getFromLocalStorage(): ScoreEntry[] {
    const saved = localStorage.getItem("multiplicationTableScores");
    return saved ? JSON.parse(saved) : [];
  }
}
