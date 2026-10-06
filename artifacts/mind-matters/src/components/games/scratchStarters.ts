export const SCRATCH_STARTERS = [
  {
    id: "chase-the-star",
    title: "Chase the star",
    description: "Move the green player with the arrow keys. Each star you collect adds a point.",
    filename: "chase-the-star.sb3",
    steps: [
      "Click the green flag to reset your score.",
      "Click the stage to focus it, then use the arrow keys to move the Player sprite toward the Star.",
      "Select Player to see its arrow-key scripts. Select Star to see how touching and scoring work.",
    ],
    challenge: "Change the movement speed from 10 to 15, then add a celebration when the score reaches 10.",
  },
  {
    id: "bouncing-ball",
    title: "Bouncing ball",
    description: "A ball moves around the stage and bounces off the edges. Experiment with its speed and direction.",
    filename: "bouncing-ball.sb3",
    steps: [
      "Click the green flag to start the ball; use the red stop button to stop it.",
      "Select Ball and find the forever loop.",
      "Change the number in move 5 steps, then run your project again.",
    ],
    challenge: "Add a second ball with a different color and speed, or turn this into a paddle game.",
  },
  {
    id: "click-counter",
    title: "Click counter",
    description: "Click the star to earn points and change its color. A simple game to practice events and variables.",
    filename: "click-counter.sb3",
    steps: [
      "Click the green flag to reset your score.",
      "Click the Star on the stage to collect points.",
      "Select Star and compare when green flag clicked with when this sprite clicked.",
    ],
    challenge: "Make the star move to a random position after each click, or add a countdown timer.",
  },
] as const;

export function starterHref(filename: string): string {
  return `${import.meta.env.BASE_URL}coding-starters/${encodeURIComponent(filename)}`;
}
