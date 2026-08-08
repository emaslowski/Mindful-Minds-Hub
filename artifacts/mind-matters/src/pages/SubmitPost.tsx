import { useState } from "react";
import { Link } from "wouter";
import { WaveFooter } from "@/components/WaveFooter";
import { useSubmitBlogPost } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  title: z.string().min(1, "Please give your story a title!"),
  author: z.string().min(1, "Let us know who you are, or type 'Anonymous'"),
  content: z.string().min(10, "Tell us a bit more! (at least 10 characters)"),
});

export default function SubmitPost() {
  const { toast } = useToast();
  const submitMutation = useSubmitBlogPost();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      author: "",
      content: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast({
            title: "Yay! Post submitted!",
            description: "Your post has been sent for review.",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Oops!",
            description: "Something went wrong. Please try again later.",
          });
        },
      }
    );
  }

  return (
    <div className="w-full flex flex-col flex-1 pt-12 relative overflow-hidden">
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 mb-24 relative z-10">
        
        <Link href="/connect" className="text-terracotta hover:text-terracotta/80 font-sans font-medium mb-8 inline-block transition-colors">
          ← Back to Blog
        </Link>

        <h1 className="text-5xl md:text-7xl font-display italic text-foreground mb-4 text-center drop-shadow-sm">
          Share Your Story
        </h1>
        <p className="text-2xl md:text-3xl text-sage font-handwritten mb-12 text-center">
          Your voice can help someone else.
        </p>

        {submitted ? (
          <div className="bg-card rounded-[2rem] p-12 text-center shadow-lg border border-sage/30">
            <div className="text-6xl mb-6 text-sage">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-20 h-20 mx-auto">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="font-display italic font-bold text-3xl mb-4 text-foreground">
              Thank you for sharing!
            </h2>
            <p className="text-foreground/80 font-sans text-lg mb-10 leading-relaxed max-w-md mx-auto">
              Your post has been lovingly received and sent for review. If approved, it will appear on the blog soon.
            </p>
            <Link href="/connect">
              <button className="bg-terracotta text-white px-10 py-3 rounded-full font-sans font-bold text-lg tracking-wide hover:bg-terracotta/90 transition-colors shadow-md">
                Back to Blog
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-[2rem] p-8 md:p-12 shadow-lg border border-card-border relative overflow-hidden">
            
            {/* Botanical Header Strip */}
            <div className="absolute top-0 left-0 w-full h-12 bg-sage/20 flex items-center justify-center space-x-8 opacity-60">
               <svg viewBox="0 0 24 24" fill="none" stroke="#688A52" strokeWidth="1.5" className="w-6 h-6"><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/><path d="M12 6v6l4 2"/></svg>
               <svg viewBox="0 0 24 24" fill="none" stroke="#688A52" strokeWidth="1.5" className="w-6 h-6"><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/><path d="M12 6v6l4 2"/></svg>
               <svg viewBox="0 0 24 24" fill="none" stroke="#688A52" strokeWidth="1.5" className="w-6 h-6"><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/><path d="M12 6v6l4 2"/></svg>
            </div>

            <div className="mt-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 relative z-10">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-display italic text-2xl text-foreground">Title of your post</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Finding peace before a test" 
                            className="bg-transparent border-0 border-b-2 border-terracotta/40 rounded-none text-lg py-4 px-0 shadow-none focus-visible:ring-0 focus-visible:border-terracotta placeholder:font-handwritten placeholder:text-2xl placeholder:text-foreground/30 font-sans"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="font-sans text-destructive" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="author"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-display italic text-2xl text-foreground">Your Name <span className="text-foreground/50 text-xl">(or "Anonymous")</span></FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="What should we call you?" 
                            className="bg-transparent border-0 border-b-2 border-terracotta/40 rounded-none text-lg py-4 px-0 shadow-none focus-visible:ring-0 focus-visible:border-terracotta placeholder:font-handwritten placeholder:text-2xl placeholder:text-foreground/30 font-sans"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="font-sans text-destructive" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-display italic text-2xl text-foreground">Your Story</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Write your story here..." 
                            className="bg-background/50 border-2 border-terracotta/30 text-lg p-6 rounded-2xl min-h-[250px] resize-y shadow-inner focus-visible:ring-1 focus-visible:ring-terracotta/50 font-sans placeholder:font-handwritten placeholder:text-2xl placeholder:text-foreground/30"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="font-sans text-destructive" />
                      </FormItem>
                    )}
                  />

                  <div className="pt-6 flex justify-center">
                    <button 
                      type="submit" 
                      disabled={submitMutation.isPending}
                      className="bg-terracotta hover:bg-terracotta/90 text-white w-full md:w-auto px-16 py-4 rounded-full font-sans font-bold text-xl tracking-wide shadow-md transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {submitMutation.isPending ? "Sending..." : "Share Story"}
                    </button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        )}
      </div>

      <WaveFooter quote="Every voice matters." />
    </div>
  );
}
