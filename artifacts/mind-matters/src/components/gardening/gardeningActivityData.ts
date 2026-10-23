export const plantCareQuestions = [
  {
    question: "What should you do before watering a plant?",
    choices: [
      "Check the soil and learn what that plant needs",
      "Give every plant the same amount",
      "Water it every hour",
    ],
    answer: 0,
    explanation:
      "Plants have different needs. Soil, weather, and the kind of plant all affect how often it needs water.",
  },
  {
    question: "Do all seeds need light to begin germinating?",
    choices: ["Yes, every seed does", "No, many seeds can start without light", "Only seeds in gardens"],
    answer: 1,
    explanation:
      "Many seeds begin to germinate without light. After a seedling emerges, many plants need light to grow well.",
  },
  {
    question: "Which part usually grows out of a seed first?",
    choices: ["A flower", "A root", "A fruit"],
    answer: 1,
    explanation:
      "A tiny root often grows first. It helps anchor the young plant and take in water.",
  },
  {
    question: "What is a helpful way to compare two seedlings?",
    choices: [
      "Change lots of things at once",
      "Give one seedling no water",
      "Change one condition and keep the others similar",
    ],
    answer: 2,
    explanation:
      "Changing one condition at a time makes it easier to notice what may have caused a difference.",
  },
  {
    question: "You find a wild berry you do not recognize. What should you do?",
    choices: [
      "Taste a tiny bit",
      "Leave it alone and tell an adult",
      "Feed it to a pet",
    ],
    answer: 1,
    explanation:
      "Never taste an unknown plant or mushroom. Leave it where it is and ask a trusted adult.",
  },
] as const;

export const growthStages = [
  { id: "sprout", label: "A shoot grows upward", detail: "The young shoot pushes toward the surface." },
  { id: "seed", label: "A seed takes in water", detail: "The seed softens and begins to wake up." },
  { id: "leaves", label: "The first leaves open", detail: "Leaves unfold and can begin catching light." },
  { id: "root", label: "A tiny root emerges", detail: "A root starts growing out of the seed." },
] as const;

export const observationPrompts = [
  "Find a leaf with a smooth edge and one with a jagged edge.",
  "Look for a plant growing in a sunny spot and one growing in shade.",
  "Notice a plant visitor, such as a bee or butterfly, from a comfortable distance.",
  "Find a leaf with a pattern of veins. Trace the pattern with your eyes.",
  "Notice how the soil looks or feels without digging or touching unknown plants.",
  "Look for a new bud, leaf, or other sign of plant growth.",
] as const;

export const growingExperiments = [
  {
    title: "Seed peek-a-boo",
    time: "About 1–2 weeks",
    question: "What changes can you spot as a seed begins to grow?",
    materials: "A few similar seeds, a clear cup, paper towel, and a little water.",
    steps: [
      "With an adult, dampen a paper towel and place it inside a clear cup.",
      "Tuck a few seeds between the towel and cup so you can observe them.",
      "Keep the towel damp, not soaked. Check once a day and draw or describe changes.",
      "After seedlings appear, ask an adult to help move them into soil and a suitable light spot.",
    ],
    safety:
      "Use untreated seeds chosen by an adult. Do not eat the seeds or seedlings. If mold appears, stop and ask an adult to dispose of the setup without sniffing it. Wash hands after handling soil.",
  },
  {
    title: "Which spot is brighter?",
    time: "A few days",
    question: "How does light look in different places?",
    materials: "A small plant, a notebook, and an adult to help choose safe spots.",
    steps: [
      "Choose two safe places near the same plant, such as a bright windowsill and a nearby shady spot.",
      "At the same time each day, notice which place seems brighter. You can make a simple word or picture note.",
      "Keep the plant in its usual suitable place; do not leave it in a spot that could harm it.",
      "Compare your notes. Many established plants need light, but the right amount depends on the plant.",
    ],
    safety:
      "Ask an adult before moving a plant. Stay away from hot windows, outlets, and climbing on furniture.",
  },
  {
    title: "How quickly does soil dry?",
    time: "A few days",
    question: "Does soil in different spots dry at the same speed?",
    materials: "Two similar small pots with soil and an adult-approved place for each.",
    steps: [
      "With an adult, put the same amount of soil in two small pots.",
      "Dampen both soils with the same small amount of water. Do not add seeds or plants for this test.",
      "Place the pots in two safe spots, such as a brighter area and a shadier area.",
      "Once a day, look at the soil surface and note which seems drier. Stop if the soil gets dusty.",
    ],
    safety:
      "Ask an adult to help with water and placement. Keep water away from electronics, and wash hands after touching soil.",
  },
] as const;
