import lake from "../assets/blog-calm-lake.jpg";
import beach from "../assets/blog-beach-path.jpg";
import boardwalk from "../assets/blog-forest-boardwalk.jpg";
import forest from "../assets/blog-forest-path.jpg";
import trail from "../assets/blog-green-trail.jpg";
import mountains from "../assets/blog-mountain-lake.jpg";
import sunset from "../assets/blog-sunset-walkway.jpg";
import steps from "../assets/blog-woodland-steps.jpg";

export const BLOG_COVERS = [
  { src: lake, alt: "A calm lake surrounded by a green landscape" },
  { src: beach, alt: "A wooden path leading to a peaceful beach" },
  { src: boardwalk, alt: "A boardwalk winding through a green forest" },
  { src: mountains, alt: "Trees beside a tranquil mountain lake" },
  { src: sunset, alt: "A wooden walkway leading toward the coast at sunset" },
  { src: trail, alt: "A quiet trail surrounded by lush greenery" },
  { src: forest, alt: "A peaceful footpath beneath tall forest trees" },
  { src: steps, alt: "Woodland steps surrounded by leafy trees" },
];

export function getBlogCover(title: string, index?: number) {
  const hash = Array.from(title).reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 0);
  return BLOG_COVERS[(index ?? hash) % BLOG_COVERS.length];
}
