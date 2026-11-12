import { Link } from "wouter";
import { useGetPublishedContent } from "@workspace/api-client-react";
import { PublishedArticle, type PublicationEdition } from "@workspace/mind-matters-ds/components/PublishedArticle";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import { Card } from "@workspace/mind-matters-ds/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@workspace/mind-matters-ds/components/ui/dialog";
import { PublicationDiscussion } from "./PublicationDiscussion";

type RecipeEdition = PublicationEdition & { projectId: number; authorDisplay?: string };

function SmallRecipeCard({ recipe }: { recipe: RecipeEdition }) {
  const details = recipe.blocks?.find((block) => block.type === "recipe")?.recipe;
  const description = details?.description || "Discover a recipe shared by our student creators.";
  return (
    <Dialog>
      <Card className="flex h-full flex-col gap-3 border-border bg-card p-4 text-left">
        <h3 className="font-serif text-xl font-bold text-foreground">{recipe.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
        {(details?.prepTime || details?.cookTime) && (
          <p className="text-xs text-muted-foreground">
            {[details.prepTime && `Prep: ${details.prepTime}`, details.cookTime && `Cook: ${details.cookTime}`].filter(Boolean).join(" · ")}
          </p>
        )}
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="mt-auto self-start" aria-label={`Read recipe: ${recipe.title}`}>Read recipe</Button>
        </DialogTrigger>
      </Card>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{recipe.title}</DialogTitle>
          <DialogDescription>The complete recipe, ingredients, and instructions.</DialogDescription>
        </DialogHeader>
        <PublishedArticle {...recipe} />
        <PublicationDiscussion
          section={`/content/publication/${recipe.projectId}`}
          title={recipe.title}
          testId={`publication-${recipe.projectId}`}
        />
      </DialogContent>
    </Dialog>
  );
}

const quickRecipes = [
  { id: 2, title: "Apples & Peanut Butter", description: "Sweet, crunch, and full of energy!", time: "5 min" },
  { id: 3, title: "Berry Blast Smoothie", description: "Packed with fruit and vitamins!", time: "10 min" },
];

export function CookingRecipes() {
  const { data, isLoading, isError, refetch } = useGetPublishedContent(
    { section: "cooking" },
    { query: { staleTime: 45_000, refetchOnWindowFocus: true } },
  );
  const recipes = (data?.publications ?? []) as RecipeEdition[];
  // The first recipe published to the cooking section (lowest "Order in
  // section") is shown in full; the rest appear as cards below it.
  const [featured, ...otherRecipes] = recipes;

  return (
    <div className="space-y-8 text-left">
      <section className="mx-auto w-full max-w-3xl" aria-labelledby="featured-recipe-title">
        <h2 id="featured-recipe-title" className="mb-4 font-handwritten text-3xl text-terracotta">Featured Recipe</h2>
        <Card className="overflow-hidden border-border bg-card p-4 sm:p-5">
          {isLoading ? <p role="status" className="text-sm text-muted-foreground">Loading recipes…</p>
            : isError ? <div role="alert">
              <p className="mb-3 text-sm text-muted-foreground">The recipes could not be loaded.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
            </div>
            : featured ? (
              <>
                <PublishedArticle {...featured} />
                <PublicationDiscussion
                  section={`/content/publication/${featured.projectId}`}
                  title={featured.title}
                  testId={`publication-${featured.projectId}`}
                />
              </>
            )
            : <p className="text-sm text-muted-foreground">The first recipe published to Cooking Corner will appear here.</p>}
        </Card>
      </section>
      <section aria-labelledby="more-recipes-title">
        <h2 id="more-recipes-title" className="mb-4 font-handwritten text-2xl text-terracotta">More Recipes</h2>
        <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherRecipes.map((recipe) => <SmallRecipeCard key={recipe.projectId} recipe={recipe} />)}
          {quickRecipes.map((recipe) => (
            <Card key={recipe.id} className="flex flex-col gap-3 border-border bg-card p-4">
              <h3 className="font-serif text-xl font-bold text-foreground">{recipe.title}</h3>
              <p className="text-sm text-muted-foreground">{recipe.description}</p>
              <p className="text-xs text-muted-foreground">Snack · {recipe.time}</p>
              <Button asChild variant="outline" size="sm" className="mt-auto self-start">
                <Link href={`/create/cooking/recipes/${recipe.id}`}>Read recipe</Link>
              </Button>
              <PublicationDiscussion
                section={`/create/cooking/recipes/${recipe.id}`}
                title={recipe.title}
                testId={`recipe-${recipe.id}`}
              />
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
