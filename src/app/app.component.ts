import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  @ViewChild("userAnswerInput") userAnswerInput!: ElementRef<HTMLInputElement>;

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

  // Animation states
  showFeedback: boolean = false;
  feedbackType: "correct" | "wrong" | null = null;
  feedbackMessage: string = "";
  isAnswering: boolean = false;
  showConfetti: boolean = false;

  ngOnInit(): void {
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
    this.askNewQuestion();
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

      this.showFeedbackAnimation(
        "correct",
        `🎉 נכון! +${questionScore} נקודות`
      );
    } else {
      this.wrongAnswers++;
      const { num1, num2 } = this.getNumbersFromQuestion();
      const correctAnswer = this.currentQuestion?.answer;
      const hint = this.getHintForNumbers({ num1, num2 });

      const wrongMessage = `❌ לא נכון!\n\nהתשובה הנכונה: ${correctAnswer}\n\n💡 ${hint}`;
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
      this.resultMessage = `ניצחת! ציון סופי: ${this.score} נקודות`;
      this.showConfetti = true;
      // Hide confetti after 5 seconds
      setTimeout(() => {
        this.showConfetti = false;
      }, 5000);
    } else {
      this.resultMessage = `הפסדת. ציון סופי: ${this.score} נקודות`;
    }
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
    // Special cases and patterns
    if (num1 === num2) {
      return `רמז: ${num1} בריבוע! זכרי: ${num1} × ${num1} = ${num1 * num1}`;
    }

    if (num1 === 1 || num2 === 1) {
      return `רמז: כל מספר כפול 1 שווה לעצמו!`;
    }

    if (num1 === 2 || num2 === 2) {
      const other = num1 === 2 ? num2 : num1;
      return `רמז: הכפילי את ${other}! (${other} + ${other})`;
    }

    if (num1 === 5 || num2 === 5) {
      const other = num1 === 5 ? num2 : num1;
      return `רמז: ספרי בחמישיות ${other} פעמים! (5, 10, 15, 20...)`;
    }

    if (num1 === 9 || num2 === 9) {
      const other = num1 === 9 ? num2 : num1;
      return `רמז: 9 × ${other} = (10 × ${other}) - ${other} = ${
        10 * other
      } - ${other}`;
    }

    if (num1 === 10 || num2 === 10) {
      const other = num1 === 10 ? num2 : num1;
      return `רמז: פשוט הוסיפי אפס ל-${other}!`;
    }

    if (num1 === 11 || num2 === 11) {
      const other = num1 === 11 ? num2 : num1;
      if (other <= 9) {
        return `רמז: 11 × ${other} = ${other}${other} (חזרי על הספרה!)`;
      }
    }

    // For larger numbers, break them down
    if (num1 > 5 && num2 > 5) {
      return `רמז: פרקי את זה! נסי (${num1} × ${Math.floor(
        num2 / 2
      )}) × 2, או השתמשי בכפל קטן יותר שאת יודעת!`;
    }

    // Default hint
    return `רמז: נסי לפרק את ${num1} × ${num2} לחלקים קטנים יותר שאת יודעת!`;
  }
}
