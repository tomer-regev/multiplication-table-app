import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
// import {
//   CloudStorageService,
//   ScoreEntry,
// } from "./services/cloud-storage.service";

import { FirebaseService, ScoreEntry } from "./services/firebase.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  @ViewChild("userAnswerInput") userAnswerInput!: ElementRef<HTMLInputElement>;
  @ViewChild("playerNameInput") playerNameInput!: ElementRef<HTMLInputElement>;

  constructor(private firebaseService: FirebaseService) {}

  maxFailures: number = 3;
  totalQuestions: number = 10;
  timeLimit: number = 15;
  currentQuestion: { question: string; answer: number } | null = null;
  userAnswer?: number;
  correctAnswers: number = 0;
  wrongAnswers: number = 0;
  timeLeft: number = this.timeLimit;
  timer: any;
  isGameOver: boolean = false;
  resultMessage: string = "";
  score: number = 0;
  hintsLeft: number = 3;
  hintUsed: boolean = false;
  currentHint: string = "";

  // Player and scoring
  playerName: string = "";
  showNameInput: boolean = false;
  showLeaderboard: boolean = false;
  topScores: ScoreEntry[] = [];

  // Animation states
  showFeedback: boolean = false;
  feedbackType: "correct" | "wrong" | null = null;
  feedbackMessage: string = "";
  isAnswering: boolean = false;
  showConfetti: boolean = false;
  showHallOfFameOverlay: boolean = false;

  ngOnInit(): void {
    this.loadTopScores();
    this.startGame();
  }

  startGame() {
    this.correctAnswers = 0;
    this.wrongAnswers = 0;
    this.isGameOver = false;
    this.resultMessage = "";
    this.score = 0;
    this.hintsLeft = 3;
    this.showConfetti = false;
    this.showNameInput = false;
    this.showLeaderboard = false;
    this.playerName = "";
    this.askNewQuestion();
  }

  newGame() {
    if (confirm("בטוחה שאת רוצה משחק חדש? כל הנקודות יעופו! 🚀")) {
      this.startGame();
    }
  }

  askNewQuestion() {
    if (
      this.correctAnswers + this.wrongAnswers >= this.totalQuestions ||
      this.wrongAnswers >= this.maxFailures
    ) {
      this.endGame();
      return;
    }

    const number1 = this.getRandomNumber();
    const number2 = this.getRandomNumber();
    this.currentQuestion = {
      question: `${number1} x ${number2} = ?`,
      answer: number1 * number2,
    };

    // Reset hint state for new question
    this.hintUsed = false;
    this.currentHint = "";

    this.timeLeft = this.timeLimit;
    this.startTimer();

    // Focus the input field after the DOM updates
    setTimeout(() => {
      if (this.userAnswerInput) {
        this.userAnswerInput.nativeElement.focus();
      }
    }, 0);
  }

  startTimer() {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        this.checkAnswer();
      }
    }, 1000);
  }

  checkAnswer() {
    this.isAnswering = true;
    clearInterval(this.timer);

    const isCorrect = this.userAnswer === this.currentQuestion?.answer;

    if (isCorrect) {
      this.correctAnswers++;

      // Calculate score: reduced points if hint was used
      const basePoints = this.hintUsed ? 5 : 10;
      const timeBonus = this.timeLeft; // 1 point per second remaining
      const questionScore = basePoints + timeBonus;
      this.score += questionScore;

      const correctMessages = [
        `🎉 יאללה! נכון! +${questionScore} נקודות`,
        `🔥 מדליק! נכון! +${questionScore} נקודות`,
        `⭐ וואו! נכון! +${questionScore} נקודות`,
        `💪 חזק! נכון! +${questionScore} נקודות`,
        `🚀 מושלם! נכון! +${questionScore} נקודות`,
      ];
      const randomMessage =
        correctMessages[Math.floor(Math.random() * correctMessages.length)];
      this.showFeedbackAnimation("correct", randomMessage);
    } else {
      this.wrongAnswers++;
      const { num1, num2 } = this.getNumbersFromQuestion();
      const correctAnswer = this.currentQuestion?.answer;
      const hint = this.getHintForNumbers({ num1, num2 });

      const wrongMessage = `❌ אופס! לא נכון הפעם...\n\nהתשובה הנכונה: ${correctAnswer}\n\n💡 ${hint}`;
      this.showFeedbackAnimation("wrong", wrongMessage);
    }

    this.userAnswer = undefined; // Reset user answer

    // Wait longer for wrong answers and hints so users can read them
    const waitTime = this.feedbackType === "wrong" ? 7500 : 1500;
    setTimeout(() => {
      this.hideFeedback();
      this.askNewQuestion();
    }, waitTime);
  }

  onSubmitAnswer() {
    if (this.isAnswering || this.userAnswer === undefined) return;
    this.checkAnswer();
  }

  showFeedbackAnimation(type: "correct" | "wrong", message: string) {
    this.feedbackType = type;
    this.feedbackMessage = message;
    this.showFeedback = true;
  }

  hideFeedback() {
    this.showFeedback = false;
    this.feedbackType = null;
    this.feedbackMessage = "";
    this.isAnswering = false;
  }

  endGame() {
    clearInterval(this.timer);
    this.isGameOver = true;
    if (this.correctAnswers === this.totalQuestions) {
      const winMessages = [
        `🎉 וואו! את מלכה! ציון סופי: ${this.score} נקודות`,
        `🔥 מדליק! את גאונית! ציון סופי: ${this.score} נקודות`,
        `⭐ יאללה! את הכי! ציון סופי: ${this.score} נקודות`,
        `👑 את אלופה! ציון סופי: ${this.score} נקודות`,
        `🚀 מושלם! את פצצה! ציון סופי: ${this.score} נקודות`,
      ];
      this.resultMessage =
        winMessages[Math.floor(Math.random() * winMessages.length)];
      this.showConfetti = true;
      // Hide confetti after 5 seconds
      setTimeout(() => {
        this.showConfetti = false;
      }, 5000);
    } else {
      const loseMessages = [
        `😊 זה בסדר! נסי שוב! ציון: ${this.score} נקודות`,
        `💪 כמעט! את תצליחי בפעם הבאה! ציון: ${this.score} נקודות`,
        `🌟 לא נורא! תתרגלי עוד קצת! ציון: ${this.score} נקודות`,
        `🎯 זה תהליך! בפעם הבאה יהיה יותר טוב! ציון: ${this.score} נקודות`,
      ];
      this.resultMessage =
        loseMessages[Math.floor(Math.random() * loseMessages.length)];
    }

    // Show name input for score saving
    this.showNameInput = true;
  }

  getRandomNumber(): number {
    return Math.floor(Math.random() * 12) + 1;
  }

  getNumbersFromQuestion(): { num1: number; num2: number } {
    if (!this.currentQuestion) return { num1: 0, num2: 0 };
    const questionText = this.currentQuestion.question;
    const numbers = questionText.match(/\d+/g);
    return {
      num1: numbers ? parseInt(numbers[0]) : 0,
      num2: numbers ? parseInt(numbers[1]) : 0,
    };
  }

  useHint() {
    if (this.hintsLeft > 0 && !this.hintUsed) {
      this.hintsLeft--;
      this.hintUsed = true;
      const { num1, num2 } = this.getNumbersFromQuestion();
      this.currentHint = this.getHintForNumbers({ num1, num2 });
    }
  }

  getHintForNumbers({ num1, num2 }: { num1: number; num2: number }): string {
    // Super fun and trendy hints for cool kids! 😎

    // Same numbers (squares)
    if (num1 === num2) {
      const stories = [
        `🎯 וואו! זה ${num1} בריבוע! כמו ${num1} חבר'ות עם ${num1} סטיקרים כל אחת! 💫`,
        `🏠 תדמייני ${num1} בתים מגניבים, ובכל בית ${num1} חדרים צבעוניים! כמה חדרים יש בכל השכונה? 🌈`,
        `🍎 יש לך ${num1} תיקים, ובכל תיק ${num1} חטיפים טעימים! כמה חטיפים בסך הכל? 🎒`,
      ];
      return (
        stories[Math.floor(Math.random() * stories.length)] +
        ` הפתרון הוא: ${num1 * num1} - קלי קלות! 🎉`
      );
    }

    // Multiplication by 1
    if (num1 === 1 || num2 === 1) {
      return `🌟 איזה כיף! כפל ב-1 זה הכי קל בעולם! כל מספר כפול 1 נשאר בדיוק אותו דבר. זה כמו לקחת ${
        num1 === 1 ? num2 : num1
      } דברים פעם אחת! 🎈`;
    }

    // Multiplication by 2 (doubling)
    if (num1 === 2 || num2 === 2) {
      const other = num1 === 2 ? num2 : num1;
      return `👯‍♀️ זה כפל! כמו תאומות! ${other} + ${other} = ${
        other * 2
      }. תחשבי על ${other} זוגות של חברות טובות! 💕`;
    }

    // Multiplication by 3
    if (num1 === 3 || num2 === 3) {
      const other = num1 === 3 ? num2 : num1;
      return `🔺 שלישיות מגניבות! ${other} + ${other} + ${other} = ${
        other * 3
      }. כמו 3 קבוצות של ${other} חברים שמשחקים יחד! 🎮`;
    }

    // Multiplication by 4
    if (num1 === 4 || num2 === 4) {
      const other = num1 === 4 ? num2 : num1;
      return `🚗 רביעיות כמו גלגלים! תחשבי על ${other} מכוניות מהירות, לכל אחת 4 גלגלים. כמה גלגלים בסך הכל? ${other} × 4 = ${
        other * 4
      } - מהיר כמו ברק! ⚡`;
    }

    // Multiplication by 5 (counting by 5s)
    if (num1 === 5 || num2 === 5) {
      const other = num1 === 5 ? num2 : num1;
      const sequence = Array.from(
        { length: other },
        (_, i) => (i + 1) * 5
      ).join(", ");
      return `✋ היי-פייב! ספרי עם האצבעות! כל יד = 5 אצבעות. ${other} ידיים = ${sequence} = ${
        other * 5
      } - זה מדליק! 🔥`;
    }

    // Multiplication by 6
    if (num1 === 6 || num2 === 6) {
      const other = num1 === 6 ? num2 : num1;
      return `🥚 חשבי על קרטוני ביצים מהסופר! כל קרטון = 6 ביצים. ${other} קרטונים = ${
        other * 6
      } ביצים! זה הולך להיות עוגה ענקית! 🎂`;
    }

    // Multiplication by 7
    if (num1 === 7 || num2 === 7) {
      const other = num1 === 7 ? num2 : num1;
      return `🌈 7 צבעי הקשת הקסומה! תדמייני ${other} קשתות יפהפיות, כל אחת עם 7 צבעים. סך הכל: ${
        other * 7
      } צבעים מדהימים! ✨`;
    }

    // Multiplication by 8
    if (num1 === 8 || num2 === 8) {
      const other = num1 === 8 ? num2 : num1;
      return `🕷️ עכבישים חמודים! לכל עכביש יש 8 רגליים. אם יש ${other} עכבישים, כמה רגליים בסך הכל? ${
        other * 8
      } רגליים! זה הרבה ריקודים! 💃`;
    }

    // Multiplication by 9 (finger trick)
    if (num1 === 9 || num2 === 9) {
      const other = num1 === 9 ? num2 : num1;
      return `🤚 הטריק הכי מגניב של 9! ${other} × 9: תחשבי ${other} × 10 = ${
        other * 10
      }, ואז תחסרי ${other}. ${other * 10} - ${other} = ${
        other * 9
      } - את גאונית! 🧠`;
    }

    // Multiplication by 10
    if (num1 === 10 || num2 === 10) {
      const other = num1 === 10 ? num2 : num1;
      return `🔟 וואו! זה הכי קל! כפל ב-10 = פשוט תוסיפי אפס! ${other} × 10 = ${other}0 - את מלכת המתמטיקה! 👑`;
    }

    // Multiplication by 11 (for single digits)
    if (num1 === 11 || num2 === 11) {
      const other = num1 === 11 ? num2 : num1;
      if (other <= 9) {
        return `🪞 הטריק הקסום של 11! ${other} × 11 = ${other}${other} (פשוט תכתבי את הספרה פעמיים!) - זה כמו קסם! 🎩✨`;
      }
    }

    // Multiplication by 12
    if (num1 === 12 || num2 === 12) {
      const other = num1 === 12 ? num2 : num1;
      return `🕐 12 כמו השעון! ${other} × 12 = ${other} × 10 + ${other} × 2 = ${
        other * 10
      } + ${other * 2} = ${other * 12} - זמן לחגוג! 🎉`;
    }

    // For larger combinations, use decomposition
    if (num1 > 6 && num2 > 6) {
      // Break down to smaller, known facts
      const smaller1 = Math.floor(num1 / 2);
      const smaller2 = Math.floor(num2 / 2);
      return `🧩 בואי נפרק את זה כמו פאזל! נסי לחשב ${smaller1} × ${smaller2} = ${
        smaller1 * smaller2
      }, ואז תכפילי פי 4! זה יהיה מדליק! 🔥`;
    }

    // General decomposition hint
    if (num1 > 5 || num2 > 5) {
      const smaller = Math.min(num1, num2);
      const larger = Math.max(num1, num2);
      if (larger > 5) {
        return `💡 בואי נפרק את ${larger} כמו פרו! נסי ${smaller} × 5 + ${smaller} × ${
          larger - 5
        } = ${smaller * 5} + ${smaller * (larger - 5)} = ${
          num1 * num2
        } - את גאונית! 🌟`;
      }
    }

    // Default encouraging hint
    return `🌟 את יכולה לעשות את זה! נסי לחשב ${num1} + ${num1} + ${num1}... או תחשבי על דברים שאת הכי אוהבת בקבוצות של ${num1}! את הכי מגניבה! 😎💪`;
  }

  // Score persistence methods using Cloud Storage
  async loadTopScores() {
    try {
      this.topScores = await this.firebaseService.getTopScores();
    } catch (error) {
      console.error("שגיאה בטעינת הציונים:", error);
    }
  }

  async saveScore() {
    if (!this.playerName.trim()) {
      alert("בבקשה תכתבי את השם שלך! 😊");
      return;
    }

    const newScore = {
      name: this.playerName.trim(),
      score: this.score,
      date: new Date().toLocaleDateString("he-IL"),
      correctAnswers: this.correctAnswers,
      totalQuestions: this.totalQuestions,
    };

    try {
      await this.firebaseService.saveScore(newScore);
      // Reload the leaderboard to show updated scores
      await this.loadTopScores();
      this.showNameInput = false;
      this.showLeaderboard = true;
    } catch (error) {
      console.error("שגיאה בשמירת הציון:", error);
      alert("אופס! הייתה בעיה בשמירת הציון. נסי שוב! 🤔");
    }
  }

  skipSaveScore() {
    this.showNameInput = false;
    this.showLeaderboard = true;
  }

  hideLeaderboard() {
    this.showLeaderboard = false;
  }

  onPlayerNameSubmit() {
    this.saveScore();
  }

  // Hall of Fame methods
  async showHallOfFame() {
    // Pause the timer while viewing Hall of Fame
    clearInterval(this.timer);

    // Refresh the scores to get the latest data
    await this.loadTopScores();

    this.showHallOfFameOverlay = true;
  }

  hideHallOfFame() {
    this.showHallOfFameOverlay = false;

    // Resume the timer if game is still active
    if (!this.isGameOver && !this.isAnswering) {
      this.startTimer();
    }
  }
}
