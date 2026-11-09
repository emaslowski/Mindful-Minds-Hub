import { useEffect, useState } from "react";
import { Link } from "wouter";
import { HeartHandshake, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/auth-web";
import {
  FriendshipProfileInputInterestsItem,
  FriendshipProfileInputQualitiesItem,
  getGetFriendshipMatchesQueryKey,
  getGetFriendshipProfileQueryKey,
  useDeleteFriendshipProfile,
  useGetFriendshipMatches,
  useGetFriendshipProfile,
  useSaveFriendshipProfile,
} from "@workspace/api-client-react";

type Interest = FriendshipProfileInputInterestsItem;
type Quality = FriendshipProfileInputQualitiesItem;
const interests = Object.values(FriendshipProfileInputInterestsItem);
const qualities = Object.values(FriendshipProfileInputQualitiesItem);

function toggle<T extends string>(selected: T[], item: T, max: number): T[] {
  return selected.includes(item)
    ? selected.filter((value) => value !== item)
    : selected.length < max ? [...selected, item] : selected;
}

export function FriendshipMatchmaker() {
  const { user, isLoading: authLoading, login } = useAuth();
  const student = user?.role === "student" || user?.accountType === "journal" || user?.journalAccountActive === true;
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastInitial, setLastInitial] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
  const [selectedQualities, setSelectedQualities] = useState<Quality[]>([]);
  const [notice, setNotice] = useState("");
  const profileQuery = useGetFriendshipProfile({
    query: { enabled: student, retry: false, refetchInterval: 15_000, refetchOnWindowFocus: true },
  });
  const matchesQuery = useGetFriendshipMatches({
    query: {
      enabled: student && profileQuery.data?.approvalStatus === "approved"
        && !!profileQuery.data.firstName && !!profileQuery.data.lastInitial,
      staleTime: 30_000, retry: false,
    },
  });
  const save = useSaveFriendshipProfile();
  const remove = useDeleteFriendshipProfile();

  useEffect(() => {
    if (!profileQuery.data) return;
    setFirstName(profileQuery.data.firstName ?? "");
    setLastInitial(profileQuery.data.lastInitial ?? "");
    setSelectedInterests(profileQuery.data.interests.filter((item): item is Interest =>
      interests.includes(item as Interest)));
    setSelectedQualities(profileQuery.data.qualities.filter((item): item is Quality =>
      qualities.includes(item as Quality)));
  }, [profileQuery.data]);

  const validName = /^\p{L}(?:[\p{L}' -]*\p{L})?$/u.test(firstName.trim())
    && firstName.trim().length <= 30
    && /^\p{L}$/u.test(lastInitial.trim().normalize("NFC").toUpperCase());
  const nameChanged = firstName.trim() !== (profileQuery.data?.firstName ?? "")
    || lastInitial.trim().toUpperCase() !== (profileQuery.data?.lastInitial ?? "");

  async function saveProfile() {
    setNotice("");
    try {
      const updated = await save.mutateAsync({
        data: {
          firstName: firstName.trim(),
          lastInitial: lastInitial.trim().toUpperCase(),
          interests: selectedInterests,
          qualities: selectedQualities,
        },
      });
      queryClient.setQueryData(getGetFriendshipProfileQueryKey(), updated);
      await queryClient.invalidateQueries({ queryKey: getGetFriendshipMatchesQueryKey() });
      setNotice(updated.approvalStatus === "approved"
        ? "Your choices are saved. Your matches are below."
        : "Your request was sent to your teacher. You'll appear in matches only after approval.");
    } catch {
      setNotice("We couldn't save your choices. Please try again.");
    }
  }

  async function leaveMatching() {
    setNotice("");
    try {
      await remove.mutateAsync();
      queryClient.setQueryData(getGetFriendshipProfileQueryKey(), {
        optedIn: false, approvalStatus: "none", firstName: null, lastInitial: null, interests: [], qualities: [],
      });
      queryClient.removeQueries({ queryKey: getGetFriendshipMatchesQueryKey() });
      setFirstName("");
      setLastInitial("");
      setSelectedInterests([]);
      setSelectedQualities([]);
      setNotice("Your friendship profile was removed. You won't appear in matches.");
    } catch {
      setNotice("We couldn't remove your profile. Please try again.");
    }
  }

  return (
    <section id="friendship-matchmaker" aria-labelledby="friendship-title" className="mx-auto mb-16 w-full max-w-6xl px-4">
      <div className="rounded-3xl border-2 border-sage/35 bg-sage/10 p-6 shadow-sm md:p-10">
        <div className="mb-3 flex items-center justify-center gap-3 text-sage">
          <HeartHandshake size={34} aria-hidden="true" />
          <h2 id="friendship-title" className="font-display text-4xl font-bold text-foreground md:text-5xl">Friendship Matchmaker</h2>
        </div>
        <p className="mx-auto max-w-2xl text-center text-foreground/80">
          Pick things you enjoy and qualities that sound like you. Find classmates who share them!
          Joining is your choice. Your teacher must approve your request before you can see matches or appear in them.
        </p>
        <p className="mt-2 text-center text-sm text-foreground/70">
          Once approved, classmates may see your first name, last initial, and the things you share. Journal entries stay private.
          No private messages or contact details here. If you want to meet someone, ask a teacher to help you say hello.
        </p>

        {authLoading ? (
          <p className="mt-8 text-center" role="status">Checking your account…</p>
        ) : !user ? (
          <div className="mt-8 text-center">
            <p className="mb-4">Sign in with your student or Journal account to ask to join.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" onClick={login} className="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-primary/85 focus-visible:ring-2 focus-visible:ring-ring">Student login</button>
              <Link href="/anonymous-access?returnTo=/connect%23friendship-matchmaker" className="rounded-full border border-primary px-6 py-3 font-bold text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring">Journal login</Link>
            </div>
          </div>
        ) : !student ? (
          <p className="mt-8 text-center font-semibold">This activity is for enrolled students and students with active Journal accounts.</p>
        ) : profileQuery.isLoading ? (
          <p className="mt-8 text-center" role="status">Loading your choices…</p>
        ) : profileQuery.isError ? (
          <p className="mt-8 text-center text-primary" role="alert">We couldn't load your profile. Make sure your student or Journal account is active, then try again.</p>
        ) : (
          <div className="mx-auto mt-8 max-w-3xl text-left">
            <div className="mb-6 rounded-2xl bg-background/80 p-5">
              <h3 className="mb-1 font-display text-2xl font-bold">Your match name</h3>
              <p className="mb-4 text-sm text-foreground/75">
                Classmates will see your first name and last initial, like Maya R. Changing your name later needs another teacher review.
              </p>
              <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
                <label className="text-sm font-semibold text-foreground">
                  First name
                  <input
                    type="text"
                    autoComplete="given-name"
                    maxLength={30}
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    data-testid="friendship-first-name"
                    className="mt-1 block w-full rounded-xl border border-sage/40 bg-background px-4 py-2 text-base font-normal text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
                <label className="text-sm font-semibold text-foreground">
                  Last initial
                  <input
                    type="text"
                    autoComplete="off"
                    maxLength={1}
                    value={lastInitial}
                    onChange={(event) => setLastInitial(event.target.value)}
                    data-testid="friendship-last-initial"
                    className="mt-1 block w-full rounded-xl border border-sage/40 bg-background px-4 py-2 text-base font-normal text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
              </div>
              {!validName && (firstName || lastInitial) && (
                <p className="mt-2 text-sm text-primary">Use letters for your first name and one letter for your last initial.</p>
              )}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <fieldset className="rounded-2xl bg-background/80 p-5">
                <legend className="sr-only">Interests</legend>
                <p className="mb-1 font-display text-2xl font-bold">Things I enjoy</p>
                <p className="mb-4 text-sm text-foreground/75">Pick 1 to 5</p>
                <div className="flex flex-wrap gap-2">
                  {interests.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={selectedInterests.includes(item)}
                      onClick={() => setSelectedInterests((current) => toggle(current, item, 5))}
                      className={`rounded-full border px-4 py-2 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring ${selectedInterests.includes(item) ? "border-sage bg-sage text-secondary-foreground" : "border-sage/40 bg-background text-foreground hover:bg-sage/15"}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="rounded-2xl bg-background/80 p-5">
                <legend className="sr-only">Qualities</legend>
                <p className="mb-1 font-display text-2xl font-bold">Words that describe me</p>
                <p className="mb-4 text-sm text-foreground/75">Pick 1 to 4</p>
                <div className="flex flex-wrap gap-2">
                  {qualities.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={selectedQualities.includes(item)}
                      onClick={() => setSelectedQualities((current) => toggle(current, item, 4))}
                      className={`rounded-full border px-4 py-2 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring ${selectedQualities.includes(item) ? "border-primary bg-primary text-primary-foreground" : "border-primary/40 bg-background text-foreground hover:bg-primary/10"}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                disabled={!validName || selectedInterests.length === 0 || selectedQualities.length === 0 || save.isPending || remove.isPending}
                onClick={saveProfile}
                className="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-primary/85 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="friendship-save"
              >
                {save.isPending ? "Saving…" :
                  profileQuery.data?.approvalStatus === "approved" && !profileQuery.data.firstName ? "Add my name for teacher review" :
                  profileQuery.data?.approvalStatus === "approved" && nameChanged ? "Request review of new name" :
                  profileQuery.data?.approvalStatus === "approved" ? "Update my choices" :
                  profileQuery.data?.approvalStatus === "pending" ? "Update my request" :
                  profileQuery.data?.approvalStatus === "rejected" ? "Ask for another review" : "Ask to join"}
              </button>
              {profileQuery.data?.optedIn && (
                <button
                  type="button"
                  disabled={remove.isPending || save.isPending}
                  onClick={leaveMatching}
                  className="rounded-full border border-primary/50 px-6 py-3 font-bold text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  data-testid="friendship-leave"
                >
                  {remove.isPending ? "Removing…" : "Leave and remove my profile"}
                </button>
              )}
            </div>
            {notice && <p className="mt-4 text-center font-semibold text-foreground" role="status">{notice}</p>}
            {profileQuery.data?.optedIn && (!profileQuery.data.firstName || !profileQuery.data.lastInitial) && (
              <p className="mt-5 text-center font-semibold text-foreground" role="status">
                Add your first name and last initial, then update your request so your teacher can review it.
              </p>
            )}
            {profileQuery.data?.approvalStatus === "pending" && profileQuery.data.firstName && profileQuery.data.lastInitial && (
              <p className="mt-5 text-center font-semibold text-foreground" role="status">
                Waiting for your teacher to approve your request. You are not visible to classmates yet.
              </p>
            )}
            {profileQuery.data?.approvalStatus === "rejected" && (
              <p className="mt-5 text-center font-semibold text-foreground" role="status">
                Your request was not approved. You can update your choices and ask your teacher to review again.
              </p>
            )}
            {profileQuery.data?.approvalStatus === "approved" && profileQuery.data.firstName && profileQuery.data.lastInitial && (
              <div className="mt-10 border-t border-sage/30 pt-7">
                <h3 className="mb-4 flex items-center justify-center gap-2 font-display text-3xl font-bold text-foreground"><Sparkles className="text-amber" aria-hidden="true" /> Your matches</h3>
                {matchesQuery.isLoading ? <p className="text-center" role="status">Finding classmates…</p>
                  : matchesQuery.isError ? <p className="text-center text-primary" role="alert">We couldn't load matches right now. Please try again later.</p>
                  : matchesQuery.data?.length ? (
                    <ul className="grid gap-4 sm:grid-cols-2">
                      {matchesQuery.data.map((match, index) => (
                        <li key={`${match.displayName}-${index}`} className="rounded-2xl border border-sage/25 bg-background p-5">
                          <h4 className="font-display text-2xl font-bold text-foreground">{match.displayName}</h4>
                          <p className="mt-1 text-sm text-foreground/80">You both enjoy {match.sharedInterests.join(", ") || "some of the same things"}{match.sharedQualities.length ? ` and share ${match.sharedQualities.join(", ")}` : ""}.</p>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-center text-foreground/80">No shared matches yet. More classmates may join soon!</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}