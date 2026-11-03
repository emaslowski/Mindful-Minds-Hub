import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@workspace/mind-matters-ds/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/mind-matters-ds/components/ui/collapsible";
import { ContentComments } from "@/components/ContentComments";

type PublicationDiscussionProps = {
  section: string;
  title: string;
  testId: string;
};

export function PublicationDiscussion({ section, title, testId }: PublicationDiscussionProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-4 w-full">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={`Comments on ${title}`}
          data-testid={`button-open-comments-${testId}`}
        >
          <MessageSquare aria-hidden="true" />
          Comments
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <ContentComments key={section} section={section} itemTitle={title} />
      </CollapsibleContent>
    </Collapsible>
  );
}
