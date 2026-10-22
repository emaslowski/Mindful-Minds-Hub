import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Volume2 } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@workspace/mind-matters-ds/components/ui/badge";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/mind-matters-ds/components/ui/card";
import { Input } from "@workspace/mind-matters-ds/components/ui/input";
import { Progress } from "@workspace/mind-matters-ds/components/ui/progress";
import { assetPath, buildPhrase, handshapeQuizLetters, phrasePuzzles, quizQuestions, shuffle, vocabulary } from "./languageGames";

type Section = "Spanish" | "ASL" | "Practice";
type SpanishGame = "Cards" | "Match" | "Quiz" | "Phrase builder";
type AslGame = "Alphabet" | "Handshape quiz" | "Fingerspelling";

const panel = "border-primary/20 bg-card/90";
const choice = "min-h-12 w-full justify-start whitespace-normal text-left";

function Flashcards() {
  const [index, setIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const card = vocabulary[index];
  useEffect(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
    return () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); };
  }, []);
  function speak() {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setVoiceMessage("Speech playback is not available in this browser. Read the word aloud or continue without audio.");
      return;
    }
    const voice = window.speechSynthesis.getVoices().find(item => /^es(?:-|$)/i.test(item.lang));
    if (!voice) {
      setVoiceMessage("No Spanish voice is available in this browser. You can still read, reveal, and practice every card without audio.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(card.spanish);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.onerror = () => setVoiceMessage("This browser could not play the word. You can still read it and keep learning.");
    utterance.onstart = () => setVoiceMessage("Playing Spanish pronunciation.");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
  function move(step: number) {
    setIndex((index + step + vocabulary.length) % vocabulary.length);
    setShowMeaning(false);
    setVoiceMessage("");
  }
  return <Card className={panel}>
    <CardHeader><CardTitle>Vocabulary flashcards</CardTitle><p className="text-sm text-muted-foreground">24 words across greetings, colors, numbers, and school. Turn over a card to reveal its meaning.</p></CardHeader>
    <CardContent>
      <div className="mb-4 flex items-center justify-between gap-3"><Badge variant="secondary">{card.category}</Badge><span className="text-sm font-semibold" aria-live="polite">Card {index + 1} of {vocabulary.length}</span></div>
      <Button variant="outline" type="button" className="block h-auto w-full whitespace-normal rounded-2xl border-primary/30 bg-background p-8 text-center" onClick={() => setShowMeaning(!showMeaning)} aria-label={showMeaning ? "Hide English meaning" : "Reveal English meaning"} data-testid="button-flashcard">
        <span lang="es" className="block font-serif text-4xl font-bold text-primary">{card.spanish}</span>
        <span className="mt-3 block text-lg">{showMeaning ? card.english : "Select to reveal the meaning"}</span>
      </Button>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={speak} data-testid="button-speak-spanish"><Volume2 aria-hidden="true" /> Hear pronunciation</Button>
        <Button type="button" variant="outline" onClick={() => move(-1)} aria-label="Previous flashcard" data-testid="button-previous-card"><ArrowLeft aria-hidden="true" /> Previous</Button>
        <Button type="button" onClick={() => move(1)} data-testid="button-next-card">Next card <ArrowRight aria-hidden="true" /></Button>
      </div>
     <p className="mt-3 min-h-6 text-sm text-muted-foreground" aria-live="polite">{voiceMessage || "Uses your browser’s Spanish voice, if available. Some voices need an internet connection. No microphone is used."}</p>
    </CardContent>
  </Card>;
}

function MatchingGame() {
  const [round, setRound] = useState(0);
  const [pairs, setPairs] = useState(() => shuffle(vocabulary.slice(0, 6)));
  const [rightColumn, setRightColumn] = useState(() => shuffle(vocabulary.slice(0, 6)));
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("Choose a Spanish word, then its English match.");
  const [wrong, setWrong] = useState<string[]>([]);
  function reset() {
    const next = shuffle(vocabulary).slice(0, 6);
    setPairs(next); setRightColumn(shuffle(next)); setMatched([]); setSelected(null); setWrong([]); setFeedback("New round. Choose a Spanish word, then its English match."); setRound(round + 1);
  }
  function choose(key: string, isSpanish: boolean) {
    if (matched.includes(key)) return;
    setWrong([]);
    if (isSpanish) { setSelected(key); setFeedback(`Selected ${key}. Now choose its meaning.`); }
    else if (selected) {
      const item = pairs.find((entry) => entry.spanish === selected);
      if (item?.english === key) {
        const result = [...matched, selected];
        setMatched(result); setSelected(null);
        setFeedback(result.length === pairs.length ? "All six pairs matched. Great work!" : `Correct: ${item.spanish} means ${item.english}.`);
      } else { setWrong([selected, key]); setFeedback("Not a match yet. Try another meaning."); setSelected(null); }
    } else setFeedback("Start by selecting a Spanish word.");
  }
  return <Card className={panel}><CardHeader><CardTitle>Six-pair match</CardTitle><p className="text-sm text-muted-foreground">Select one Spanish word and then its English meaning. Each pair stays matched when correct.</p></CardHeader><CardContent>
    <div className="mb-3 grid grid-cols-2 gap-3"><div className="space-y-2">{pairs.map((item) => <Button key={item.spanish} type="button" variant={matched.includes(item.spanish) ? "secondary" : selected === item.spanish ? "default" : "outline"} disabled={matched.includes(item.spanish)} className={choice} onClick={() => choose(item.spanish, true)} data-testid={`button-match-es-${item.spanish}`}>{item.spanish}</Button>)}</div><div className="space-y-2">{rightColumn.map((item) => <Button key={item.english} type="button" variant={matched.includes(item.spanish) ? "secondary" : wrong.includes(item.english) ? "destructive" : "outline"} disabled={matched.includes(item.spanish)} className={choice} onClick={() => choose(item.english, false)} data-testid={`button-match-en-${item.spanish}`}>{item.english}</Button>)}</div></div>
    <p className="mb-3 min-h-6 text-sm font-semibold" aria-live="polite">{feedback} {matched.length}/{pairs.length} pairs</p>
    <Button type="button" variant="outline" onClick={reset} data-testid="button-replay-match"><RotateCcw aria-hidden="true" /> {matched.length === pairs.length ? "Play again" : "Restart round"}</Button>
  </CardContent></Card>;
}

function QuizGame() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const current = quizQuestions[step];
  function restart() { setStep(0); setScore(0); setAnswer(null); }
  return <Card className={panel}><CardHeader><CardTitle>Spanish quick quiz</CardTitle><p className="text-sm text-muted-foreground">Choose an answer. Feedback appears before you move to the next question.</p></CardHeader><CardContent>
    {step < quizQuestions.length ? <><div className="mb-4 flex items-center justify-between"><span className="text-sm font-semibold">Question {step + 1} of {quizQuestions.length}</span><Badge variant="accent">Score {score}</Badge></div><Progress value={((step + 1) / quizQuestions.length) * 100} aria-label={`Question ${step + 1} of ${quizQuestions.length}`} /><h3 className="my-5 font-serif text-2xl font-bold">{current.prompt}</h3><div className="space-y-2">{current.choices.map((item) => <Button key={item} type="button" className={choice} variant={answer === item ? (item === current.answer ? "secondary" : "destructive") : "outline"} disabled={!!answer} onClick={() => { setAnswer(item); if (item === current.answer) setScore(score + 1); }} data-testid={`button-quiz-${step}-${item}`}>{item}</Button>)}</div>{answer && <div className="mt-4" aria-live="polite"><p className="font-semibold">{answer === current.answer ? "Correct." : `Not quite. The answer is ${current.answer}.`}</p><Button className="mt-3" onClick={() => { setStep(step + 1); setAnswer(null); }} data-testid="button-quiz-next">{step === quizQuestions.length - 1 ? "See results" : "Next question"} <ArrowRight aria-hidden="true" /></Button></div>}</> : <div className="py-4 text-center" aria-live="polite"><Badge variant="secondary">Quiz complete</Badge><h3 className="mt-3 font-serif text-3xl font-bold">{score} of {quizQuestions.length} correct</h3><p className="mt-2">Every try is practice. Review a word and give it another go.</p><Button className="mt-4" onClick={restart} data-testid="button-replay-quiz"><RotateCcw aria-hidden="true" /> Play again</Button></div>}
  </CardContent></Card>;
}

function PhraseBuilder() {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [available, setAvailable] = useState<string[]>(() => shuffle(phrasePuzzles[0].spanish));
  const [built, setBuilt] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const puzzle = phrasePuzzles[puzzleIndex];
  function reset() { setAvailable(shuffle(puzzle.spanish)); setBuilt([]); setFeedback(""); }
  function selectToken(index: number) { setBuilt([...built, available[index]]); setAvailable(available.filter((_, tokenIndex) => tokenIndex !== index)); setFeedback(""); }
  function undo() { if (built.length) { setAvailable([...available, built[built.length - 1]]); setBuilt(built.slice(0, -1)); setFeedback(""); } }
  function next() { const index = (puzzleIndex + 1) % phrasePuzzles.length; setPuzzleIndex(index); setAvailable(shuffle(phrasePuzzles[index].spanish)); setBuilt([]); setFeedback(""); }
  const correct = buildPhrase(built, puzzle.spanish);
  return <Card className={panel}><CardHeader><CardTitle>Phrase builder</CardTitle><p className="text-sm text-muted-foreground">Tap word tiles to build the Spanish sentence for the English prompt. Repeated tiles are separate pieces.</p></CardHeader><CardContent>
    <Badge variant="secondary">Translate: {puzzle.english}</Badge><div className="my-4 flex min-h-16 flex-wrap gap-2 rounded-xl border border-border bg-background p-3" aria-label="Your phrase" aria-live="polite">{built.map((token, index) => <Badge key={`${token}-${index}`} variant={feedback && correct ? "secondary" : "outline"}>{token}</Badge>)}{built.length === 0 && <span className="text-sm text-muted-foreground">Your phrase will appear here</span>}</div>
    <div className="flex flex-wrap gap-2">{available.map((token, index) => <Button key={`${token}-${index}`} variant="outline" onClick={() => selectToken(index)} data-testid={`button-phrase-token-${index}`}>{token}</Button>)}</div>
    <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" onClick={undo} disabled={!built.length} data-testid="button-phrase-undo">Undo</Button><Button variant="outline" onClick={reset} data-testid="button-phrase-reset"><RotateCcw aria-hidden="true" /> Reset</Button><Button onClick={() => setFeedback(correct ? "Correct! You built the phrase." : "Not quite yet. Check the order and try again.")} disabled={built.length !== puzzle.spanish.length} data-testid="button-phrase-check">Check phrase</Button>{feedback === "Correct! You built the phrase." && <Button variant="secondary" onClick={next} data-testid="button-phrase-next">Next phrase <ArrowRight aria-hidden="true" /></Button>}</div>
    <p className="mt-3 min-h-6 text-sm font-semibold" aria-live="polite">{feedback}</p>
  </CardContent></Card>;
}

function Alphabet() {
  const [letter, setLetter] = useState("A");
  const url = assetPath(`${letter}.svg`);
  return <Card className={panel}><CardHeader><CardTitle>ASL alphabet gallery</CardTitle><p className="text-sm text-muted-foreground">Explore each letter’s handshape. These static images show a hand position; J and Z need movement and are explained separately.</p></CardHeader><CardContent>
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">{Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ").map((item) => <Button key={item} variant={letter === item ? "default" : "outline"} onClick={() => setLetter(item)} aria-pressed={letter === item} data-testid={`button-asl-letter-${item}`}>{item}</Button>)}</div>
    <div className="mt-5 grid items-center gap-4 rounded-2xl border border-border bg-background p-4 sm:grid-cols-2"><img className="mx-auto max-h-64 w-full max-w-64 object-contain" src={url} alt={`ASL fingerspelling handshape for letter ${letter}`} /><div><Badge variant="secondary">Letter {letter}</Badge><p className="mt-3">{letter === "J" ? "J starts from the I handshape, then the pinky traces a J through the air." : letter === "Z" ? "Z uses the index finger to trace a Z through the air." : `Study the handshape for ${letter}, then try forming it yourself. Handshapes can vary slightly by signer.`}</p>{(letter === "J" || letter === "Z") && <p className="mt-2 text-sm text-muted-foreground">This letter requires motion, so one still image cannot show the complete sign.</p>}</div></div>
    <p className="mt-4 text-xs text-muted-foreground">Image credit: Ds13 / Darren Stone, vectorized by Marnanel; public domain. <a className="underline" href="https://commons.wikimedia.org/wiki/File:Asl_alphabet_gallaudet.svg" target="_blank" rel="noreferrer">View the alphabet source on Wikimedia Commons</a>.</p>
  </CardContent></Card>;
}

function HandshapeQuiz() {
  const [round, setRound] = useState(0);
  const [letters, setLetters] = useState(() => shuffle(handshapeQuizLetters).slice(0, 5));
  const [current, setCurrent] = useState(letters[0]);
  const [answered, setAnswered] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const choices = useMemo(() => shuffle([current, ...shuffle(handshapeQuizLetters.filter((item) => item !== current)).slice(0, 3)]), [current]);
  function restart() { const fresh = shuffle(handshapeQuizLetters).slice(0, 5); setLetters(fresh); setCurrent(fresh[0]); setRound(0); setScore(0); setAnswered(null); }
  function next() { const position = round + 1; if (position < letters.length) { setRound(position); setCurrent(letters[position]); setAnswered(null); } else { setRound(position); } }
  return <Card className={panel}><CardHeader><CardTitle>Which letter is this handshape?</CardTitle><p className="text-sm text-muted-foreground">Identify still handshapes. J and Z are left out because each needs a movement trace.</p></CardHeader><CardContent>
    {round < letters.length ? <><div className="mb-3 flex justify-between text-sm font-semibold"><span>Round {round + 1} of {letters.length}</span><span>Score {score}</span></div><Progress value={((round + 1) / letters.length) * 100} /><img className="mx-auto my-4 h-52 w-full max-w-56 object-contain" src={assetPath(`${current}.svg`)} alt="Handshape to identify" /><div className="grid grid-cols-2 gap-2">{choices.map((item) => <Button key={item} variant={answered === item ? (item === current ? "secondary" : "destructive") : "outline"} disabled={!!answered} onClick={() => { setAnswered(item); if (item === current) setScore(score + 1); }} data-testid={`button-handshape-answer-${item}`}>{item}</Button>)}</div>{answered && <div className="mt-3" aria-live="polite"><p className="font-semibold">{answered === current ? "Correct." : `That was ${current}. Keep looking closely.`}</p><Button className="mt-2" onClick={next}>{round === letters.length - 1 ? "Finish quiz" : "Next letter"} <ArrowRight aria-hidden="true" /></Button></div>}</> : <div className="py-5 text-center"><Badge variant="secondary">Round complete</Badge><h3 className="mt-3 font-serif text-3xl font-bold">{score} of {letters.length} correct</h3><Button className="mt-4" onClick={restart} data-testid="button-replay-handshape"><RotateCcw aria-hidden="true" /> Try another round</Button></div>}
  </CardContent></Card>;
}

function Fingerspelling() {
  const [word, setWord] = useState("HI");
  const [position, setPosition] = useState(0);
  const letters = word.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 12).split("");
  const current = letters[position];
  return <Card className={panel}><CardHeader><CardTitle>Spell a word with handshapes</CardTitle><p className="text-sm text-muted-foreground">Enter up to 12 letters and step through the handshapes. This models fingerspelling letter by letter, not sign recognition or translation.</p></CardHeader><CardContent>
    <label className="mb-2 block text-sm font-semibold" htmlFor="spell-word">A word to spell</label><Input id="spell-word" className="mb-4" value={word} maxLength={12} onChange={(event) => { setWord(event.target.value.replace(/[^a-z]/gi, "").slice(0, 12)); setPosition(0); }} data-testid="input-spell-word" />
    <div className="grid items-center gap-4 rounded-2xl border border-border bg-background p-4 sm:grid-cols-2">{current ? <img className="mx-auto h-52 w-full max-w-56 object-contain" src={assetPath(`${current}.svg`)} alt={`ASL fingerspelling handshape for ${current}`} /> : <p className="p-4 text-muted-foreground">Enter a word above to see its handshapes.</p>}<div>{current && <Badge variant="accent">Letter {current}</Badge>}<p className="mt-3 font-serif text-2xl font-bold tracking-widest">{letters.join(" ") || "Enter letters"}</p><p className="text-sm text-muted-foreground">Step {letters.length ? position + 1 : 0} of {letters.length}</p>{(current === "J" || current === "Z") && <p className="mt-2 text-sm">Follow the arrow: J moves the pinky from the I handshape; Z traces a Z with the index finger. These letters need movement.</p>}</div></div>
    <div className="mt-4 flex gap-2"><Button variant="outline" disabled={position === 0} onClick={() => setPosition(Math.max(0, position - 1))} data-testid="button-spell-previous"><ArrowLeft aria-hidden="true" /> Previous</Button><Button disabled={position >= letters.length - 1} onClick={() => setPosition(Math.min(letters.length - 1, position + 1))} data-testid="button-spell-next">Next letter <ArrowRight aria-hidden="true" /></Button></div>
  </CardContent></Card>;
}

function Practice() {
  const prompts = [
    { title: "Start a friendly conversation", prompt: "Practice a greeting and ask someone how their day is going. Take turns listening and responding." },
    { title: "Learn together", prompt: "Choose one Spanish flashcard or ASL letter. Teach a partner what you noticed, then let them teach you something." },
    { title: "Make space for access", prompt: "Ask a partner what communication works best for them. Face one another, take turns, and make sure everyone can participate." },
  ];
  const [index, setIndex] = useState(0);
  const [complete, setComplete] = useState<number[]>([]);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const prompt = prompts[index];
  const greetings = [
    { language: "Spanish", phrase: "Buenos días", meaning: "Good morning", lang: "es" },
    { language: "French", phrase: "Bonjour", meaning: "Hello / Good morning", lang: "fr" },
    { language: "Japanese", phrase: "こんにちは", meaning: "Hello", lang: "ja" },
  ];
  const greeting = greetings[greetingIndex];
  return <div className="space-y-4"><Card className={panel}><CardHeader><CardTitle>Partner conversation practice</CardTitle><p className="text-sm text-muted-foreground">No microphone or recording. Read a prompt together and practice at your own pace.</p></CardHeader><CardContent><Badge variant="secondary">Prompt {index + 1} of {prompts.length}</Badge><h3 className="mt-4 font-serif text-2xl font-bold">{prompt.title}</h3><p className="mt-2 leading-relaxed">{prompt.prompt}</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" onClick={() => setIndex((index + prompts.length - 1) % prompts.length)} data-testid="button-previous-prompt"><ArrowLeft aria-hidden="true" /> Previous</Button><Button onClick={() => setIndex((index + 1) % prompts.length)} data-testid="button-next-prompt">Next prompt <ArrowRight aria-hidden="true" /></Button><Button variant={complete.includes(index) ? "secondary" : "outline"} onClick={() => setComplete(complete.includes(index) ? complete.filter((item) => item !== index) : [...complete, index])} data-testid="button-mark-prompt"><Check aria-hidden="true" /> {complete.includes(index) ? "Practiced" : "Mark practiced"}</Button></div><p className="mt-3 text-sm text-muted-foreground" aria-live="polite">{complete.length} of {prompts.length} prompts practiced this visit.</p></CardContent></Card>
    <Card className={panel}><CardHeader><CardTitle>Greetings to explore</CardTitle><p className="text-sm text-muted-foreground">A quick hello from Spanish, French, and Japanese. These greetings are a starting point for exploring another language.</p></CardHeader><CardContent><div className="flex flex-wrap gap-2" role="group" aria-label="Choose a greeting">{greetings.map((item, itemIndex) => <Button key={item.language} variant={itemIndex === greetingIndex ? "secondary" : "outline"} aria-pressed={itemIndex === greetingIndex} onClick={() => setGreetingIndex(itemIndex)} data-testid={`button-greeting-${item.language.toLowerCase()}`}>{item.language}</Button>)}</div><div className="mt-4 rounded-xl border border-border bg-background p-4" aria-live="polite"><p className="text-sm font-semibold text-primary">{greeting.language}</p><p lang={greeting.lang} className="mt-1 font-serif text-3xl font-bold">{greeting.phrase}</p><p className="mt-1 text-sm text-muted-foreground">Means “{greeting.meaning}”</p></div></CardContent></Card>
    <Card className={panel}><CardHeader><CardTitle>ASL and Deaf-culture notes</CardTitle></CardHeader><CardContent className="space-y-3"><p><strong>ASL is a full language.</strong> It has its own grammar and culture; it is not signed English and is not universal across countries.</p><p><strong>Fingerspelling is one part of ASL.</strong> It can represent names or words, but it is not a substitute for learning signs and grammar.</p><p><strong>Respect people’s choices.</strong> Do not invent a name sign for someone. A person’s name sign, if they use one, is theirs to share.</p><p><strong>Learn from Deaf educators.</strong> <a className="underline" href="https://www.lifeprint.com/asl101/fingerspelling/fingerspelling.htm" target="_blank" rel="noreferrer">Lifeprint fingerspelling lesson</a> includes motion demonstrations. J traces from the I handshape with the pinky; Z is traced with the index finger.</p></CardContent></Card>
  </div>;
}

export default function LanguageCenter() {
  const [section, setSection] = useState<Section>("Spanish");
  const [spanishGame, setSpanishGame] = useState<SpanishGame>("Cards");
  const [aslGame, setAslGame] = useState<AslGame>("Alphabet");
  const spanishOptions: SpanishGame[] = ["Cards", "Match", "Quiz", "Phrase builder"];
  const aslOptions: AslGame[] = ["Alphabet", "Handshape quiz", "Fingerspelling"];
  return <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:py-12">
    <Link href="/" className="mb-6 inline-flex rounded-full border border-primary/40 px-5 py-2 font-semibold text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring" data-testid="link-language-home">Back to home</Link>
    <header className="mb-6"><p className="font-semibold uppercase tracking-wider text-secondary">A little learning, a lot of fun</p><h1 className="mt-1 font-serif text-4xl font-bold text-foreground sm:text-5xl">Language Corner</h1><p className="mt-3 max-w-3xl text-foreground/80">Play with Spanish words, explore ASL handshapes, and practice thoughtful conversations. Your activity progress lasts only for this visit and is not saved to an account.</p></header>
    <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Choose a language activity"><Button variant={section === "Spanish" ? "default" : "outline"} aria-pressed={section === "Spanish"} onClick={() => setSection("Spanish")} data-testid="button-category-spanish">Spanish games</Button><Button variant={section === "ASL" ? "default" : "outline"} aria-pressed={section === "ASL"} onClick={() => setSection("ASL")} data-testid="button-category-asl">ASL studio</Button><Button variant={section === "Practice" ? "default" : "outline"} aria-pressed={section === "Practice"} onClick={() => setSection("Practice")} data-testid="button-category-practice">Practice together</Button></div>
    <div hidden={section !== "Spanish"}>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Choose a Spanish game">{spanishOptions.map((game) => <Button key={game} variant={spanishGame === game ? "secondary" : "outline"} aria-pressed={spanishGame === game} onClick={() => setSpanishGame(game)} data-testid={`button-spanish-game-${game.toLowerCase().replaceAll(" ", "-")}`}>{game}</Button>)}</div>
      <div hidden={spanishGame !== "Cards"}><Flashcards /></div>
      <div hidden={spanishGame !== "Match"}><MatchingGame /></div>
      <div hidden={spanishGame !== "Quiz"}><QuizGame /></div>
      <div hidden={spanishGame !== "Phrase builder"}><PhraseBuilder /></div>
    </div>
    <div hidden={section !== "ASL"}>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Choose an ASL activity">{aslOptions.map((game) => <Button key={game} variant={aslGame === game ? "secondary" : "outline"} aria-pressed={aslGame === game} onClick={() => setAslGame(game)} data-testid={`button-asl-game-${game.toLowerCase().replaceAll(" ", "-")}`}>{game}</Button>)}</div>
      <div hidden={aslGame !== "Alphabet"}><Alphabet /></div>
      <div hidden={aslGame !== "Handshape quiz"}><HandshapeQuiz /></div>
      <div hidden={aslGame !== "Fingerspelling"}><Fingerspelling /></div>
    </div>
    <div hidden={section !== "Practice"}><Practice /></div>
    <p className="mt-6 text-xs text-muted-foreground">Learning is for exploration, not a translation or sign-recognition service. Spanish audio uses optional browser speech synthesis when available.</p>
  </main>;
}
