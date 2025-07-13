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

  // Addictive game features
  achievements: string[] = [];
  newAchievements: string[] = [];
  showAchievementPopup: boolean = false;
  totalGamesPlayed: number = 0;
  totalCorrectAnswers: number = 0;
  fastestAnswer: number = 999;
  currentComboMultiplier: number = 1;
  gems: number = 0;
  level: number = 1;
  experiencePoints: number = 0;
  experienceToNextLevel: number = 100;
  unlockedThemes: string[] = ["princess"];
  currentTheme: string = "princess";
  dailyStreak: number = 0;
  lastPlayDate: string = "";

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
  showShareOverlay: boolean = false;

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
    const responseTime = this.timeLimit - this.timeLeft;

    if (isCorrect) {
      this.correctAnswers++;
      this.totalCorrectAnswers++;
      this.streak++;

      // Update best streak
      if (this.streak > this.bestStreak) {
        this.bestStreak = this.streak;
      }

      // Calculate combo multiplier based on streak
      this.currentComboMultiplier = Math.min(
        1 + Math.floor(this.streak / 3) * 0.5,
        3
      );

      // Calculate score with combo multiplier
      const basePoints = this.hintUsed ? 5 : 10;
      const timeBonus = this.timeLeft;
      const comboBonus = Math.floor(
        basePoints * (this.currentComboMultiplier - 1)
      );
      const questionScore = Math.floor(
        (basePoints + timeBonus + comboBonus) * this.currentComboMultiplier
      );
      this.score += questionScore;

      // Award gems for good performance
      let gemsEarned = 1;
      if (!this.hintUsed && this.timeLeft > 10) {
        gemsEarned = 3; // Perfect answer
        this.perfectAnswers++;
      } else if (!this.hintUsed) {
        gemsEarned = 2; // Good answer
      }
      this.gems += gemsEarned;

      // Add experience points
      this.experiencePoints += Math.floor(questionScore / 2);
      this.checkLevelUp();

      // Track fastest answer
      if (responseTime < this.fastestAnswer) {
        this.fastestAnswer = responseTime;
      }

      // Create enhanced feedback message
      let correctMessage = "";
      if (this.streak >= 5) {
        correctMessage = `🔥 COMBO x${this.currentComboMultiplier.toFixed(
          1
        )}! רצף של ${this.streak}! +${questionScore} נקודות +${gemsEarned}💎`;
      } else if (this.streak >= 3) {
        correctMessage = `⚡ רצף מדליק! ${this.streak} ברצף! +${questionScore} נקודות +${gemsEarned}💎`;
      } else {
        const messages = [
          `🎉 יאללה! נכון! +${questionScore} נקודות +${gemsEarned}💎`,
          `🔥 מדליק! נכון! +${questionScore} נקודות +${gemsEarned}💎`,
          `⭐ וואו! נכון! +${questionScore} נקודות +${gemsEarned}💎`,
          `💪 חזק! נכון! +${questionScore} נקודות +${gemsEarned}💎`,
          `🚀 מושלם! נכון! +${questionScore} נקודות +${gemsEarned}💎`,
        ];
        correctMessage = messages[Math.floor(Math.random() * messages.length)];
      }

      this.showFeedbackAnimation("correct", correctMessage);
      this.checkAchievements();
    } else {
      this.wrongAnswers++;
      this.streak = 0; // Reset streak on wrong answer
      this.currentComboMultiplier = 1;

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

  // Addictive game mechanics
  checkLevelUp() {
    if (this.experiencePoints >= this.experienceToNextLevel) {
      this.level++;
      this.experiencePoints -= this.experienceToNextLevel;
      this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);

      // Award gems for leveling up
      this.gems += this.level * 5;

      // Show level up celebration
      this.showLevelUpCelebration();

      // Unlock new themes at certain levels
      this.checkThemeUnlocks();
    }
  }

  checkAchievements() {
    const newAchievements: string[] = [];

    // First time achievements
    if (
      this.totalCorrectAnswers === 1 &&
      !this.achievements.includes("first_correct")
    ) {
      newAchievements.push("first_correct");
      this.achievements.push("first_correct");
    }

    // Streak achievements
    if (this.streak === 3 && !this.achievements.includes("streak_3")) {
      newAchievements.push("streak_3");
      this.achievements.push("streak_3");
    }
    if (this.streak === 5 && !this.achievements.includes("streak_5")) {
      newAchievements.push("streak_5");
      this.achievements.push("streak_5");
    }
    if (this.streak === 10 && !this.achievements.includes("streak_10")) {
      newAchievements.push("streak_10");
      this.achievements.push("streak_10");
    }

    // Perfect game achievement
    if (
      this.correctAnswers === this.totalQuestions &&
      this.wrongAnswers === 0 &&
      !this.achievements.includes("perfect_game")
    ) {
      newAchievements.push("perfect_game");
      this.achievements.push("perfect_game");
    }

    // Speed achievements
    if (
      this.fastestAnswer <= 3 &&
      !this.achievements.includes("lightning_fast")
    ) {
      newAchievements.push("lightning_fast");
      this.achievements.push("lightning_fast");
    }

    // Gem collector achievements
    if (this.gems >= 50 && !this.achievements.includes("gem_collector_50")) {
      newAchievements.push("gem_collector_50");
      this.achievements.push("gem_collector_50");
    }
    if (this.gems >= 100 && !this.achievements.includes("gem_collector_100")) {
      newAchievements.push("gem_collector_100");
      this.achievements.push("gem_collector_100");
    }

    // Level achievements
    if (this.level >= 5 && !this.achievements.includes("level_5")) {
      newAchievements.push("level_5");
      this.achievements.push("level_5");
    }
    if (this.level >= 10 && !this.achievements.includes("level_10")) {
      newAchievements.push("level_10");
      this.achievements.push("level_10");
    }

    // Perfect answers achievement
    if (
      this.perfectAnswers >= 5 &&
      !this.achievements.includes("perfectionist")
    ) {
      newAchievements.push("perfectionist");
      this.achievements.push("perfectionist");
    }

    // Show achievement popup if new achievements unlocked
    if (newAchievements.length > 0) {
      this.newAchievements = newAchievements;
      this.showAchievementPopup = true;
      this.gems += newAchievements.length * 10; // Bonus gems for achievements
    }
  }

  showLevelUpCelebration() {
    const levelUpMessage = `🎉 עלית רמה! רמה ${this.level}! 🎉\n+${
      this.level * 5
    } יהלומים! 💎`;
    this.showFeedbackAnimation("correct", levelUpMessage);
  }

  checkThemeUnlocks() {
    const themeUnlocks = [
      { level: 3, theme: "unicorn", name: "חד-קרן קסום" },
      { level: 5, theme: "rainbow", name: "קשת בענן" },
      { level: 7, theme: "fairy", name: "פיה קטנה" },
      { level: 10, theme: "mermaid", name: "בת ים" },
    ];

    themeUnlocks.forEach((unlock) => {
      if (
        this.level >= unlock.level &&
        !this.unlockedThemes.includes(unlock.theme)
      ) {
        this.unlockedThemes.push(unlock.theme);
        // Show theme unlock notification
        setTimeout(() => {
          alert(`🎨 נפתח עיצוב חדש: ${unlock.name}! 🎨`);
        }, 2000);
      }
    });
  }

  getAchievementTitle(achievementId: string): string {
    const achievements = {
      first_correct: "🌟 התחלה מושלמת!",
      streak_3: "🔥 רצף של 3!",
      streak_5: "⚡ רצף מדליק!",
      streak_10: "🚀 רצף אגדי!",
      perfect_game: "👑 משחק מושלם!",
      lightning_fast: "⚡ מהירות הברק!",
      gem_collector_50: "💎 אספנית יהלומים!",
      gem_collector_100: "💎 מלכת היהלומים!",
      level_5: "⭐ רמה 5!",
      level_10: "🌟 רמה 10!",
      perfectionist: "✨ פרפקציוניסטית!",
    };
    return (
      achievements[achievementId as keyof typeof achievements] || achievementId
    );
  }

  closeAchievementPopup() {
    this.showAchievementPopup = false;
    this.newAchievements = [];
  }

  shareScore() {
    const shareText = `🎉 זכיתי ב-${this.score} נקודות במשחק הכפל הכי מגניב! 💎 יש לי ${this.gems} יהלומים ואני ברמה ${this.level}! בואו תנסו גם! 🚀`;

    if (navigator.share) {
      navigator.share({
        title: "משחק הכפל הקסום",
        text: shareText,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard
        .writeText(shareText + " " + window.location.href)
        .then(() => {
          alert("הציון הועתק! שתפי עם החברות שלך! 📱");
        });
    }
  }

  shareWithFriends() {
    // Show the enhanced graphic share overlay
    this.showShareOverlay = true;
  }

  getShareEmoji(): string {
    if (this.score >= 80) return "🌟👑";
    if (this.score >= 60) return "🎉✨";
    if (this.score >= 40) return "💪🔥";
    return "🌈💖";
  }

  getEncouragingMessage(): string {
    const messages = [
      "וואו! זה עתה סיימתי את משחק הכפל הקסום!",
      "יאללה! הרגע עשיתי משהו מדליק במתמטיקה!",
      "חברות! תראו מה השגתי במשחק הכי מגניב!",
      "אני פשוט גאונית במתמטיקה! תראו:",
      "הרגע הפכתי למלכת הכפל! 👑",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  getShareableAchievements(): string {
    const achievements = [];

    if (this.correctAnswers === this.totalQuestions) {
      achievements.push("🏆 משחק מושלם - כל התשובות נכונות!");
    }
    if (this.bestStreak >= 5) {
      achievements.push(`🔥 רצף אש של ${this.bestStreak} תשובות נכונות ברצף!`);
    }
    if (this.perfectAnswers >= 3) {
      achievements.push("⚡ מהירות הברק - תשובות מושלמות!");
    }
    if (this.gems >= 20) {
      achievements.push(`💎 אספנית יהלומים מקצועית - ${this.gems} יהלומים!`);
    }
    if (this.level >= 3) {
      achievements.push(`🚀 עליתי לרמה ${this.level} - אני מתקדמת!`);
    }

    return achievements.length > 0
      ? `🏅 ההישגים שלي:\n${achievements.join("\n")}\n`
      : "🌟 אני משתפרת בכל משחק!\n";
  }

  getFriendChallenge(): string {
    const challenges = [
      "🎯 מי מכן מוכנה לאתגר אותי?",
      "💪 בואו נראה מי תוכל לנצח אותי!",
      "🏆 מי הולכת להיות המלכה הבאה של הכפל?",
      "⚡ חברות, בואו נראה מי הכי מהירה!",
      "🌟 מי רוצה להצטרף למשחק הכי מגניב?",
    ];
    return challenges[Math.floor(Math.random() * challenges.length)];
  }

  showShareOptions(shareText: string, whatsappUrl: string) {
    const options = [
      { name: "WhatsApp", url: whatsappUrl, icon: "💬" },
      {
        name: "העתק טקסט",
        action: () => this.copyToClipboard(shareText),
        icon: "📋",
      },
    ];

    // Create a simple modal for desktop sharing options
    const modal = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;">
        <div style="background: linear-gradient(135deg, #ff9a9e, #fecfef); padding: 30px; border-radius: 20px; text-align: center; max-width: 400px; margin: 20px;">
          <h3 style="color: #d63384; margin-bottom: 20px;">📱 שתפי עם החברות שלך!</h3>
          <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
            <button onclick="window.open('${whatsappUrl}', '_blank')" style="background: #25D366; color: white; border: none; padding: 15px 20px; border-radius: 15px; cursor: pointer; font-size: 16px; font-weight: bold;">💬 WhatsApp</button>
            <button onclick="navigator.clipboard.writeText(\`${shareText.replace(
              /`/g,
              "\\`"
            )}\`).then(() => alert('הטקסט הועתק! 📋')); document.body.removeChild(document.querySelector('[data-share-modal]'))" style="background: #ff6b9d; color: white; border: none; padding: 15px 20px; border-radius: 15px; cursor: pointer; font-size: 16px; font-weight: bold;">📋 העתק</button>
          </div>
          <button onclick="document.body.removeChild(document.querySelector('[data-share-modal]'))" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 15px; cursor: pointer; margin-top: 15px;">❌ סגור</button>
        </div>
      </div>
    `;

    const modalElement = document.createElement("div");
    modalElement.innerHTML = modal;
    modalElement.setAttribute("data-share-modal", "true");
    document.body.appendChild(modalElement);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert("הטקסט הועתק! עכשיו את יכולה להדביק אותו בכל מקום! 📱");
    });
  }

  // Enhanced Share Overlay Methods
  closeShareOverlay() {
    this.showShareOverlay = false;
  }

  getAvatarTheme(): string {
    if (this.score >= 90) return "avatar-legendary";
    if (this.score >= 80) return "avatar-epic";
    if (this.score >= 60) return "avatar-rare";
    if (this.score >= 40) return "avatar-uncommon";
    return "avatar-common";
  }

  getAvatarCharacter(): string {
    if (this.score >= 90) return "👸";
    if (this.score >= 80) return "🧚‍♀️";
    if (this.score >= 60) return "🦄";
    if (this.score >= 40) return "🌟";
    return "😊";
  }

  getScoreRank(): string {
    if (this.score >= 90) return "אגדית!";
    if (this.score >= 80) return "מדהימה!";
    if (this.score >= 60) return "מעולה!";
    if (this.score >= 40) return "טובה!";
    return "התחלה נהדרת!";
  }

  getAccuracyPercentage(): number {
    if (this.totalQuestions === 0) return 0;
    return Math.round((this.correctAnswers / this.totalQuestions) * 100);
  }

  getTopAchievements(): string[] {
    return this.achievements.slice(0, 3); // Show top 3 achievements
  }

  getAchievementIcon(achievement: string): string {
    const icons = {
      first_correct: "🌟",
      streak_3: "🔥",
      streak_5: "⚡",
      streak_10: "🚀",
      perfect_game: "👑",
      lightning_fast: "⚡",
      gem_collector_50: "💎",
      gem_collector_100: "💎",
      level_5: "⭐",
      level_10: "🌟",
      perfectionist: "✨",
    };
    return icons[achievement as keyof typeof icons] || "🏆";
  }

  getAchievementShortTitle(achievement: string): string {
    const titles = {
      first_correct: "התחלה",
      streak_3: "רצף 3",
      streak_5: "רצף 5",
      streak_10: "רצף 10",
      perfect_game: "מושלם",
      lightning_fast: "מהירה",
      gem_collector_50: "אספנית",
      gem_collector_100: "מלכה",
      level_5: "רמה 5",
      level_10: "רמה 10",
      perfectionist: "מושלמת",
    };
    return titles[achievement as keyof typeof titles] || "הישג";
  }

  getMotivationalMessage(): string {
    const messages = [
      "את פשוט מדהימה במתמטיקה! 🌟",
      "איזה כישרון יש לך! 💫",
      "את הוכחת שמתמטיקה זה כיף! 🎉",
      "הישגים כאלה מראים כמה את מוכשרת! ✨",
      "את מקור השראה לכל הבנות! 👑",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  getFloatingEmojis(): string[] {
    return ["✨", "🌟", "💫", "🎉", "💖", "🦄", "🌈", "👑"];
  }

  async shareToWhatsApp() {
    try {
      // First try to generate and share the image
      await this.shareImageToWhatsApp();
    } catch (error) {
      console.log("Image sharing failed, falling back to text:", error);
      // Fallback to text sharing
      const shareText = this.generateGraphicShareText();
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
        shareText
      )}`;
      window.open(whatsappUrl, "_blank");
    }
  }

  async shareImageToWhatsApp() {
    try {
      // Import html2canvas dynamically
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default;

      // Target only the clean shareable card, not the entire overlay
      const shareElement = document.querySelector(
        ".shareable-card"
      ) as HTMLElement;
      if (!shareElement) {
        throw new Error("Shareable card element not found");
      }

      // Configure html2canvas options for mobile-optimized sharing
      const canvas = await html2canvas(shareElement, {
        backgroundColor: "#fff8dc",
        scale: 2, // Higher resolution for crisp mobile display
        useCORS: true,
        allowTaint: true,
        width: Math.min(500, window.innerWidth * 0.9), // Much wider for landscape
        height: shareElement.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        logging: false, // Disable logging for cleaner output
        removeContainer: true, // Clean up after capture
      });

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob: Blob | null) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create blob"));
            }
          },
          "image/png",
          0.95 // Higher quality for sharing
        );
      });

      // Create a file from the blob
      const file = new File([blob], "my-multiplication-achievement.png", {
        type: "image/png",
      });

      // Try to share using Web Share API with image
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: "משחק הכפל הקסום - ההישגים שלי!",
          text: this.generateShortShareText(),
          files: [file],
        });
      } else {
        // Fallback: Create a download link and open WhatsApp with text
        this.downloadImageAndShareText(canvas);
      }
    } catch (error) {
      console.error("Error in shareImageToWhatsApp:", error);
      throw error;
    }
  }

  downloadImageAndShareText(canvas: HTMLCanvasElement) {
    // Create download link for the image
    const link = document.createElement("a");
    link.download = "my-multiplication-achievement.png";
    link.href = canvas.toDataURL("image/png");

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show instructions and open WhatsApp
    const shortText = this.generateShortShareText();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shortText)}`;

    // Show user instructions
    setTimeout(() => {
      alert(
        "התמונה הורדה! עכשיו:\n1. שתפי את התמונה שהורדה\n2. הוסיפי את הטקסט מהודעת WhatsApp\n\nWhatsApp נפתח עכשיו עם הטקסט! 📱✨"
      );
      window.open(whatsappUrl, "_blank");
    }, 500);
  }

  generateShortShareText(): string {
    const avatar = this.getAvatarCharacter();
    const rank = this.getScoreRank();

    return `${avatar} הרגע השגתי ${this.score} נקודות במשחק הכפל הקסום! 
    
🏆 רמה ${this.level} | 💎 ${this.gems} יהלומים | 🔥 רצף ${this.bestStreak}

${this.getMotivationalMessage()}

בואו תנסו גם! 🚀
${window.location.href}

#משחק_כפל #מתמטיקה_מגניבה`;
  }

  shareToGeneral() {
    const shareText = this.generateGraphicShareText();
    if (navigator.share) {
      navigator.share({
        title: "משחק הכפל הקסום",
        text: shareText,
        url: window.location.href,
      });
    } else {
      this.copyShareText();
    }
  }

  copyShareText() {
    const shareText = this.generateGraphicShareText();
    navigator.clipboard.writeText(shareText).then(() => {
      alert("הטקסט הועתק! 📋");
    });
  }

  generateGraphicShareText(): string {
    const avatar = this.getAvatarCharacter();
    const rank = this.getScoreRank();
    const achievements = this.getTopAchievements();
    const motivational = this.getMotivationalMessage();
    const challenge = this.getFriendChallenge();

    let achievementText = "";
    if (achievements.length > 0) {
      achievementText = `\n🏆 ההישגים שלי:\n${achievements
        .map(
          (a) => `${this.getAchievementIcon(a)} ${this.getAchievementTitle(a)}`
        )
        .join("\n")}\n`;
    }

    return `${avatar} ${motivational}

🎯 הציון שלי: ${this.score} נקודות (${rank})
💎 יהלומים: ${this.gems}
🏆 רמה: ${this.level}
🔥 רצף הכי טוב: ${this.bestStreak}
🎯 דיוק: ${this.getAccuracyPercentage()}%
${achievementText}
${challenge}

בואו תנסו גם את משחק הכפל הכי מגניב! 🚀
${window.location.href}

#משחק_כפל #מתמטיקה_מגניבה #חברות_לנצח`;
  }
}
