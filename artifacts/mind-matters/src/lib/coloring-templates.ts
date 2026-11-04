export type ColoringTemplate = {
  id: string;
  title: string;
  description: string;
  svg?: string;
  imageUrl?: string;
};

function flower(cx: number, cy: number, size: number): string {
  const petals = Array.from({ length: 8 }, (_, index) =>
    `<ellipse cx="${cx}" cy="${cy - size * 0.8}" rx="${size * 0.3}" ry="${size * 0.58}" transform="rotate(${index * 45} ${cx} ${cy})" fill="white"/>`,
  ).join("");
  return `<g>${petals}<circle cx="${cx}" cy="${cy}" r="${size * 0.32}" fill="white"/></g>`;
}

const FLOWER_GARDEN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 650">
  <g fill="none" stroke="black" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M55 575 Q230 548 450 575 T845 575"/>
    <path d="M215 565V350 M435 565V300 M665 565V375"/>
    <path d="M215 475 Q145 475 133 420 Q203 420 215 475Z M215 435 Q285 435 300 385 Q232 385 215 435Z"/>
    <path d="M435 465 Q365 465 350 410 Q420 410 435 465Z M435 415 Q505 415 520 365 Q450 365 435 415Z"/>
    <path d="M665 490 Q595 490 580 435 Q650 435 665 490Z M665 445 Q735 445 750 395 Q680 395 665 445Z"/>
    ${flower(215, 300, 68)}
    ${flower(435, 235, 82)}
    ${flower(665, 320, 70)}
    <path d="M88 563 Q85 528 65 507 M92 562 Q102 529 120 520 M785 566 Q790 530 812 511 M782 562 Q769 538 754 530"/>
    <path d="M105 135 C65 105 45 70 70 55 C87 44 101 57 105 68 C111 51 129 44 143 56 C165 76 142 111 105 135Z"/>
    <circle cx="754" cy="104" r="35"/>
    <path d="M754 48V32 M754 176V160 M698 104H682 M826 104H810 M714 64L703 53 M805 155L794 144 M794 64L805 53 M703 155L714 144"/>
    <path d="M305 104 C305 81 327 72 342 84 C355 60 390 63 400 84 C427 79 441 108 423 120 H320 C309 120 305 113 305 104Z"/>
  </g>
</svg>`;

export const BUILT_IN_COLORING_TEMPLATES: ColoringTemplate[] = [
  {
    id: "flower-garden",
    title: "Flower garden",
    description: "A sunny garden full of blooms, leaves, and little details.",
    svg: FLOWER_GARDEN,
  },
  {
    id: "butterfly-meadow",
    title: "Butterfly meadow",
    description: "A big butterfly floating over a field of curling grasses.",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 650"><g fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M447 296c-46-105-181-203-255-150-78 56-7 170 101 191-103 17-136 106-74 145 75 48 186-43 228-122m6-64c48-105 181-203 255-150 78 56 7 170-101 191 103 17 136 106 74 145-75 48-186-43-228-122Zm0-10v135m-13-142c-27-26-31-57-18-85m30 85c27-26 31-57 18-85m-23 222c-52 56-91 93-155 129m173-129c52 56 91 93 155 129M95 560c54-13 93-9 126 1 41-23 83-22 124-3 39-27 88-30 137-4 49-26 98-23 137 4 41-19 83-20 124 3 33-10 72-14 126-1"/></g><g fill="none" stroke="#000" stroke-width="4"><path d="M256 184c41 7 76 33 100 69m-117 14c43-6 84 6 116 29m-133 38c42-22 84-26 126-16m296-134c-41 7-76 33-100 69m117 14c-43-6-84 6-116 29m133 38c-42-22-84-26-126-16M190 519c6-46 28-79 63-100m-22 105c22-39 55-60 98-63m63 62c-1-46 15-82 47-110m138 110c1-46-15-82-47-110m139 111c-6-46-28-79-63-100m22 105c-22-39-55-60-98-63"/></g><g fill="none" stroke="#000" stroke-width="4"><circle cx="303" cy="224" r="18"/><circle cx="351" cy="270" r="14"/><circle cx="282" cy="334" r="17"/><circle cx="597" cy="224" r="18"/><circle cx="549" cy="270" r="14"/><circle cx="618" cy="334" r="17"/></g></svg>`,
  },
  {
    id: "sunny-landscape",
    title: "Sunny landscape",
    description: "Rolling hills, a bright sun, and a quiet little cottage.",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 650"><g fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><circle cx="690" cy="142" r="66"/><path d="M690 38V14m0 256v-24m104-104h24M562 142h24m178-74 18-18m-185 185 18-18m149 0 18 18M581 68l-18-18m220 92h24"/><path d="M60 442c116-104 216-98 328-10 117-114 253-103 452 22v145H60V442Z"/><path d="M60 512c121-66 235-56 346 14 125-66 280-48 434 27v46H60v-87Z"/><path d="m148 341 103-91 103 91v116H148V341Z"/><path d="m133 345 118-108 118 108M188 457V353h68v104m20 0v-61h48v61M148 389h27m72-38h30m-129-11h-18"/><path d="M465 422v-57m0 0c-30-24-28-54-8-70 22 24 25 47 8 70Zm0 0c28-25 58-19 66 5-20 19-44 19-66-5Zm-246 95v-47m0 0c-24-18-25-41-9-54 19 17 21 36 9 54Zm0 0c22-18 43-12 50 7-15 14-33 13-50-7Zm405 67v-52m0 0c-25-19-25-43-8-57 20 18 22 38 8 57Zm0 0c23-19 45-13 52 7-16 15-35 14-52-7Z"/><path d="M95 158c28-23 56-22 81 0 26-22 55-23 83 0m-164 0c28 24 56 24 81 0 26 24 55 24 83 0M390 163c23-18 47-18 69 0 22-18 46-18 69 0m-138 0c23 20 47 20 69 0 22 20 46 20 69 0"/></g></svg>`,
  },
  { id: "blank", title: "Blank canvas", description: "A fresh white page for your own ideas." },
];

export function publishedColoringTemplateId(projectId: number, blockId: string): string {
  return `published-${projectId}-${blockId}`;
}
