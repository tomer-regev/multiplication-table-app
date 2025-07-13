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

  // Enhanced game features
  streak: number = 0;
  bestStreak: number = 0;
  totalTimeSpent: number = 0;
  gameStartTime: number = 0;
  questionStartTime: number = 0;
  averageResponseTime: number = 0;
  perfectAnswers: number = 0; // Answers without hints and with time bonus

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

    // Reset enhanced features
    this.streak = 0;
    this.bestStreak = 0;
    this.totalTimeSpent = 0;
    this.gameStartTime = Date.now();
    this.perfectAnswers = 0;

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
    // AI-Generated Super Fun & Memorable Hints for 10-year-old Girls! 🌟

    const answer = num1 * num2;

    // Same numbers (squares) - Make it magical!
    if (num1 === num2) {
      const magicalStories = [
        `✨ קסם של ${num1}! תדמייני ${num1} נסיכות, כל אחת עם ${num1} יהלומים נוצצים! סך הכל: ${answer} יהלומים מקסימים! 💎👑`,
        `🦄 ${num1} חד-קרנים קסומים, כל אחד עם ${num1} כוכבים על הקרן! זה ${answer} כוכבים שמאירים את השמיים! ⭐`,
        `🌸 ${num1} פרחים יפהפיים, כל פרח עם ${num1} עלי כותרת צבעוניים! זה ${answer} עלים מדהימים! 🌺`,
      ];
      return magicalStories[Math.floor(Math.random() * magicalStories.length)];
    }

    // Multiplication by 1 - You're already perfect!
    if (num1 === 1 || num2 === 1) {
      const other = num1 === 1 ? num2 : num1;
      return `🌟 את כבר מושלמת! כפל ב-1 זה כמו להיות עצמך - ${other} נשאר ${other}! זה הכי קל בעולם! 💖`;
    }

    // Multiplication by 2 - Best friends forever!
    if (num1 === 2 || num2 === 2) {
      const other = num1 === 2 ? num2 : num1;
      return `👭 חברות לנצח! ${other} + ${other} = ${answer}! תחשבי על ${other} זוגות של חברות טובות שרוקדות יחד! 💃✨`;
    }

    // Multiplication by 3 - Triangle magic!
    if (num1 === 3 || num2 === 3) {
      const other = num1 === 3 ? num2 : num1;
      return `🔺 קסם המשולש! ${other} קבוצות של 3 חברות שעושות פירמידה אנושית! ${other} + ${other} + ${other} = ${answer}! 🤸‍♀️`;
    }

    // Multiplication by 4 - Four-leaf clover luck!
    if (num1 === 4 || num2 === 4) {
      const other = num1 === 4 ? num2 : num1;
      return `🍀 תלתן של מזל! ${other} תלתנים עם 4 עלים כל אחד = ${answer} עלים של מזל! את תמיד תהיי בת מזל! 🌟`;
    }

    // Multiplication by 5 - High five power!
    if (num1 === 5 || num2 === 5) {
      const other = num1 === 5 ? num2 : num1;
      return `✋ כוח ההיי-פייב! ${other} ידיים עם 5 אצבעות = ${answer} אצבעות שמחות! ספרי על האצבעות! 🙌`;
    }

    // Multiplication by 6 - Flower petals!
    if (num1 === 6 || num2 === 6) {
      const other = num1 === 6 ? num2 : num1;
      return `🌻 פרחי שמש מקסימים! ${other} פרחים עם 6 עלי כותרת כל אחד = ${answer} עלים יפהפיים! 🌺`;
    }

    // Multiplication by 7 - Rainbow magic!
    if (num1 === 7 || num2 === 7) {
      const other = num1 === 7 ? num2 : num1;
      return `🌈 קשת בענן קסומה! ${other} קשתות עם 7 צבעים כל אחת = ${answer} צבעים מדהימים שמאירים את העולם! ✨`;
    }

    // Multiplication by 8 - Octopus dance!
    if (num1 === 8 || num2 === 8) {
      const other = num1 === 8 ? num2 : num1;
      return `🐙 תמנון רקדן! ${other} תמנונים חמודים עם 8 זרועות כל אחד = ${answer} זרועות שרוקדות! איזה מופע! 💃`;
    }

    // Multiplication by 9 - Magic trick!
    if (num1 === 9 || num2 === 9) {
      const other = num1 === 9 ? num2 : num1;
      return `🎩 הטריק הקסום של 9! ${other} × 10 = ${
        other * 10
      }, עכשיו תחסרי ${other}: ${
        other * 10
      } - ${other} = ${answer}! את קוסמת אמיתית! ✨`;
    }

    // Multiplication by 10 - Super easy!
    if (num1 === 10 || num2 === 10) {
      const other = num1 === 10 ? num2 : num1;
      return `🔟 סופר קל! כפל ב-10 = תוסיפי אפס! ${other} הופך ל-${answer}! את מלכת המתמטיקה! 👑💖`;
    }

    // Multiplication by 11 - Mirror magic!
    if (num1 === 11 || num2 === 11) {
      const other = num1 === 11 ? num2 : num1;
      if (other <= 9) {
        return `🪞 קסם המראה! ${other} × 11 = ${other}${other} (הספרה מסתכלת על עצמה במראה!) = ${answer}! 🎭✨`;
      }
    }

    // Multiplication by 12 - Clock magic!
    if (num1 === 12 || num2 === 12) {
      const other = num1 === 12 ? num2 : num1;
      return `🕐 קסם השעון! ${other} × 12 = ${other} × 10 + ${other} × 2 = ${
        other * 10
      } + ${other * 2} = ${answer}! זמן לחגוג! 🎉`;
    }

    // For larger combinations - Story method
    if (num1 > 6 && num2 > 6) {
      return `📚 סיפור מתמטי! תחלקי את ${Math.max(
        num1,
        num2
      )} לחלקים קטנים יותר. למשל: ${Math.min(num1, num2)} × 5 + ${Math.min(
        num1,
        num2
      )} × ${Math.max(num1, num2) - 5} = ${answer}! 🌟`;
    }

    // General decomposition - Building blocks
    if (num1 > 5 || num2 > 5) {
      const smaller = Math.min(num1, num2);
      const larger = Math.max(num1, num2);
      return `🧱 בואי נבנה! ${smaller} × 5 = ${
        smaller * 5
      }, ועוד ${smaller} × ${larger - 5} = ${smaller * (larger - 5)}. ביחד: ${
        smaller * 5
      } + ${smaller * (larger - 5)} = ${answer}! 🏗️`;
    }

    // Default encouraging hint with visualization
    const visualHints = [
      `🌟 תדמייני ${num1} קבוצות של ${num2} חברות שמשחקות יחד! כמה חברות בסך הכל? ${answer}! 👭`,
      `🎨 ${num1} צבעים, כל צבע עם ${num2} גוונים! זה ${answer} גוונים מדהימים לציור! 🖌️`,
      `🍭 ${num1} שקיות ממתקים, בכל שקית ${num2} סוכריות! זה ${answer} סוכריות מתוקות! 🍬`,
      `⭐ ${num1} כוכבים, כל כוכב עם ${num2} קרניים! זה ${answer} קרני אור מנצנצות! ✨`,
    ];
    return visualHints[Math.floor(Math.random() * visualHints.length)];
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
