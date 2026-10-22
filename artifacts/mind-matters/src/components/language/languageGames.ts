export type VocabularyCard = { spanish: string; english: string; category: string };

export const vocabulary: VocabularyCard[] = [
  { spanish: "hola", english: "hello", category: "Greetings" },
  { spanish: "adiós", english: "goodbye", category: "Greetings" },
  { spanish: "buenos días", english: "good morning", category: "Greetings" },
  { spanish: "buenas tardes", english: "good afternoon", category: "Greetings" },
  { spanish: "por favor", english: "please", category: "Greetings" },
  { spanish: "gracias", english: "thank you", category: "Greetings" },
  { spanish: "rojo", english: "red", category: "Colors" },
  { spanish: "azul", english: "blue", category: "Colors" },
  { spanish: "amarillo", english: "yellow", category: "Colors" },
  { spanish: "verde", english: "green", category: "Colors" },
  { spanish: "morado", english: "purple", category: "Colors" },
  { spanish: "anaranjado", english: "orange", category: "Colors" },
  { spanish: "uno", english: "one", category: "Numbers" },
  { spanish: "dos", english: "two", category: "Numbers" },
  { spanish: "tres", english: "three", category: "Numbers" },
  { spanish: "cuatro", english: "four", category: "Numbers" },
  { spanish: "cinco", english: "five", category: "Numbers" },
  { spanish: "seis", english: "six", category: "Numbers" },
  { spanish: "el libro", english: "the book", category: "School" },
  { spanish: "la escuela", english: "the school", category: "School" },
  { spanish: "el lápiz", english: "the pencil", category: "School" },
  { spanish: "la mochila", english: "the backpack", category: "School" },
  { spanish: "la clase", english: "the class", category: "School" },
  { spanish: "el maestro", english: "the teacher", category: "School" },
];

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildPhrase(tokens: string[], target: string[]) {
  return tokens.length === target.length && tokens.every((token, index) => token === target[index]);
}

export const phrasePuzzles = [
  { english: "Hello, how are you?", spanish: ["hola,", "¿cómo", "estás?"] },
  { english: "Thank you very much.", spanish: ["muchas", "gracias", "."] },
  { english: "I have a book.", spanish: ["yo", "tengo", "un", "libro", "."] },
  { english: "The backpack is in the school.", spanish: ["la", "mochila", "está", "en", "la", "escuela", "."] },
  { english: "Good morning, teacher.", spanish: ["buenos", "días,", "maestro", "."] },
  { english: "The book is blue.", spanish: ["el", "libro", "es", "azul", "."] },
];

export const quizQuestions = [
  { prompt: "Which word means “green”?", answer: "verde", choices: ["verde", "rojo", "azul"] },
  { prompt: "What does “la escuela” mean?", answer: "the school", choices: ["the school", "the pencil", "the class"] },
  { prompt: "Which greeting means “good morning”?", answer: "buenos días", choices: ["buenas tardes", "buenos días", "adiós"] },
  { prompt: "What is “five” in Spanish?", answer: "cinco", choices: ["tres", "dos", "cinco"] },
  { prompt: "What does “por favor” mean?", answer: "please", choices: ["thank you", "please", "hello"] },
];

export const handshapeQuizLetters = "ABCDEFGHIKLMNOPQRSTUVWXY".split("");

export function assetPath(file: string) {
  const base = import.meta.env.BASE_URL || "/";
  return `${base.replace(/\/?$/, "/")}images/asl/${file}`;
}
