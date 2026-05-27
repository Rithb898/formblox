import "dotenv/config";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import db from "./index";
import {
  usersTable,
  userCredentialsTable,
  workspacesTable,
  workspaceMembersTable,
  formsTable,
  formVersionsTable,
  formFieldsTable,
  responsesTable,
  responseAnswersTable,
  aiFollowupsTable,
} from "./schema";
import { eq, and } from "drizzle-orm";

const DEMO_EMAIL = "rithb8981@gmail.com";
const DEMO_PASSWORD = "Rithb@8981";
const DEMO_NAME = "Rith B";

// ─── helpers ───────────────────────────────────────────────────────────────

function fieldId() {
  return nanoid(10);
}

function randomDate(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// ─── seed data ─────────────────────────────────────────────────────────────

const FORMS: {
  title: string;
  description: string;
  visibility: "public" | "unlisted";
  fields: {
    id: string;
    type: "short_text" | "long_text" | "email" | "number" | "single_choice" | "multiple_choice" | "rating" | "date";
    label: string;
    required: boolean;
    config: Record<string, unknown>;
  }[];
  responses: { answers: Record<string, unknown>; followups?: { fieldId: string; aiQuestion: string; userAnswer: string }[] }[];
}[] = [];

// ─── Form 1: Anime Fan Survey (public) ─────────────────────────────────────
{
  const f1 = fieldId(), f2 = fieldId(), f3 = fieldId(), f4 = fieldId(), f5 = fieldId(), f6 = fieldId();
  FORMS.push({
    title: "Anime Fan Survey 2025",
    description: "Tell us about your anime taste! Help us discover the most loved shows this season.",
    visibility: "public",
    fields: [
      { id: f1, type: "short_text", label: "What's your anime username or alias?", required: true, config: { placeholder: "e.g. SailorMoonFan99" } },
      { id: f2, type: "single_choice", label: "Which genre do you watch most?", required: true, config: { options: [{ id: "a", label: "Shonen" }, { id: "b", label: "Isekai" }, { id: "c", label: "Slice of Life" }, { id: "d", label: "Mecha" }, { id: "e", label: "Horror" }], randomize: false } },
      { id: f3, type: "rating", label: "Rate your current season (1-10)", required: true, config: { scale: 10, style: "number" } },
      { id: f4, type: "multiple_choice", label: "Which platforms do you use?", required: false, config: { options: [{ id: "a", label: "Crunchyroll" }, { id: "b", label: "Netflix" }, { id: "c", label: "HiDive" }, { id: "d", label: "Funimation" }], randomize: false, min: 1, max: 4 } },
      { id: f5, type: "long_text", label: "What's your all-time favourite anime and why?", required: true, config: { placeholder: "Tell us about it…", minLength: 20, maxLength: 500 } },
      { id: f6, type: "email", label: "Email for giveaway entry (optional)", required: false, config: { placeholder: "you@example.com" } },
    ],
    responses: [
      { answers: { [f1]: "NarutoFan2025", [f2]: "a", [f3]: 9, [f4]: ["a", "b"], [f5]: "Attack on Titan — the world-building and moral complexity are unmatched. Every character feels real.", [f6]: "user1@example.com" }, followups: [{ fieldId: f5, aiQuestion: "What aspect of the world-building impressed you the most?", userAnswer: "The way Isayama built the mystery around the walls — I was hooked from episode 1." }] },
      { answers: { [f1]: "IsekaiLord", [f2]: "b", [f3]: 8, [f4]: ["a"], [f5]: "Re:Zero — the psychological depth of Subaru's character arc is something I've never seen in any other show.", [f6]: "" }, followups: [{ fieldId: f5, aiQuestion: "How did Re:Zero's time-loop mechanic affect your attachment to the characters?", userAnswer: "It made every death feel devastating because you knew Subaru remembered everything." }] },
      { answers: { [f1]: "SliceOfLifeQueen", [f2]: "c", [f3]: 7, [f4]: ["b", "c"], [f5]: "K-On! It's just pure joy — watching the girls grow together over four seasons never gets old.", [f6]: "" } },
      { answers: { [f1]: "MechaPilot", [f2]: "d", [f3]: 10, [f4]: ["a", "b", "d"], [f5]: "Neon Genesis Evangelion — it changed how I think about animation as a medium.", [f6]: "mecha@example.com" }, followups: [{ fieldId: f5, aiQuestion: "Did the psychological themes in Eva influence your view of other mecha anime?", userAnswer: "Completely. Nothing else feels as honest about trauma." }] },
      { answers: { [f1]: "HorrorOtaku", [f2]: "e", [f3]: 9, [f4]: ["b"], [f5]: "Shiki — it's the only anime that genuinely scared me and made me question who the real monsters were.", [f6]: "" } },
      { answers: { [f1]: "GenreHopper", [f2]: "b", [f3]: 8, [f4]: ["a", "c"], [f5]: "No Game No Life — the strategy and colour palette are insane. Shame it got one season.", [f6]: "" } },
      { answers: { [f1]: "TokyoGhoulFan", [f2]: "a", [f3]: 6, [f4]: ["a"], [f5]: "Tokyo Ghoul season 1 was flawless. I try to forget the rest exists.", [f6]: "" } },
      { answers: { [f1]: "FMABrother", [f2]: "a", [f3]: 10, [f4]: ["b", "a"], [f5]: "Fullmetal Alchemist: Brotherhood — perfect pacing, perfect ending, perfect everything.", [f6]: "fmab@example.com" }, followups: [{ fieldId: f5, aiQuestion: "Which character arc in FMAB resonated with you the most personally?", userAnswer: "Roy Mustang — his journey from ambition to guilt to redemption is masterfully done." }] },
      { answers: { [f1]: "SpiritedFan", [f2]: "c", [f3]: 9, [f4]: ["b"], [f5]: "Spirited Away — okay it's a film but it counts. Miyazaki's world feels alive in ways TV anime rarely achieves.", [f6]: "" } },
      { answers: { [f1]: "DemonSlayer99", [f2]: "a", [f3]: 8, [f4]: ["a", "b"], [f5]: "Demon Slayer — Ufotable's animation quality is on another level. Every fight scene is a short film.", [f6]: "" } },
      { answers: { [f1]: "VinlandSaga_", [f2]: "a", [f3]: 10, [f4]: ["c"], [f5]: "Vinland Saga — it starts as a revenge story and slowly becomes one of the most powerful anti-war narratives in any medium.", [f6]: "vinland@example.com" } },
      { answers: { [f1]: "CowboyBebopFan", [f2]: "c", [f3]: 10, [f4]: ["b", "d"], [f5]: "Cowboy Bebop — the jazz, the freedom, the loneliness. It aged perfectly.", [f6]: "" } },
      { answers: { [f1]: "HunterHunterG", [f2]: "a", [f3]: 9, [f4]: ["a"], [f5]: "HxH 2011 — the Chimera Ant arc alone is worth more than most full series.", [f6]: "" }, followups: [{ fieldId: f5, aiQuestion: "What about the Chimera Ant arc made it stand out from standard shonen arcs?", userAnswer: "The moral ambiguity — Meruem started as a villain and ended as one of the most sympathetic characters in anime." }] },
      { answers: { [f1]: "JJKWatcher", [f2]: "a", [f3]: 7, [f3]: 7, [f4]: ["a", "b"], [f5]: "Jujutsu Kaisen — great fights, great characters. Waiting for the manga to finish before I form a final opinion.", [f6]: "" } },
      { answers: { [f1]: "PsychoPassFan", [f2]: "e", [f3]: 9, [f4]: ["b", "c"], [f5]: "Psycho-Pass season 1 — cyberpunk dystopia done right. The Sibyl System is still relevant today.", [f6]: "" } },
      { answers: { [f1]: "BluePeriodArt", [f2]: "c", [f3]: 8, [f4]: ["b"], [f5]: "Blue Period — as someone who studied art, this anime captured the pressure and joy of creation better than anything.", [f6]: "" } },
      { answers: { [f1]: "OnePieceCrew", [f2]: "a", [f3]: 8, [f4]: ["a", "b"], [f5]: "One Piece — 1000+ episodes and I'm still not tired of it. Oda is a genius.", [f6]: "" } },
      { answers: { [f1]: "MadokaMagica", [f2]: "e", [f3]: 10, [f4]: ["b", "d"], [f5]: "Madoka Magica — it looks like a cute magical girl show and then destroys you emotionally by episode 3.", [f6]: "madoka@example.com" }, followups: [{ fieldId: f5, aiQuestion: "How did Madoka subvert your expectations of the magical girl genre?", userAnswer: "I expected something like Sailor Moon. What I got was an existential horror about the cost of hope." }] },
      { answers: { [f1]: "SteinGate0Fan", [f2]: "b", [f3]: 9, [f4]: ["a", "c"], [f5]: "Steins;Gate — the time travel logic is watertight and the emotional payoff is devastating.", [f6]: "" } },
      { answers: { [f1]: "YourLieName", [f2]: "c", [f3]: 9, [f4]: ["b"], [f5]: "Your Lie in April — I knew it would break me and I watched it anyway. No regrets.", [f6]: "" } },
    ],
  });
}

// ─── Form 2: Startup Feedback Form (public) ─────────────────────────────────
{
  const f1 = fieldId(), f2 = fieldId(), f3 = fieldId(), f4 = fieldId(), f5 = fieldId(), f6 = fieldId(), f7 = fieldId();
  FORMS.push({
    title: "Startup Product Feedback",
    description: "Help us build a better product. Your honest feedback shapes our roadmap.",
    visibility: "public",
    fields: [
      { id: f1, type: "short_text", label: "What is your role?", required: true, config: { placeholder: "e.g. Founder, Engineer, Designer…" } },
      { id: f2, type: "single_choice", label: "How did you hear about us?", required: true, config: { options: [{ id: "a", label: "Twitter / X" }, { id: "b", label: "Product Hunt" }, { id: "c", label: "Word of mouth" }, { id: "d", label: "Search" }, { id: "e", label: "Newsletter" }], randomize: false } },
      { id: f3, type: "rating", label: "Overall satisfaction (1-10)", required: true, config: { scale: 10, style: "star" } },
      { id: f4, type: "single_choice", label: "Which feature matters most to you?", required: true, config: { options: [{ id: "a", label: "AI form generation" }, { id: "b", label: "Response analytics" }, { id: "c", label: "Custom themes" }, { id: "d", label: "Integrations / API" }], randomize: false } },
      { id: f5, type: "long_text", label: "What problem were you trying to solve when you found us?", required: true, config: { placeholder: "Describe your situation…", minLength: 30, maxLength: 600 } },
      { id: f6, type: "single_choice", label: "Would you recommend us to a colleague?", required: true, config: { options: [{ id: "a", label: "Definitely yes" }, { id: "b", label: "Probably yes" }, { id: "c", label: "Not sure" }, { id: "d", label: "Probably not" }], randomize: false } },
      { id: f7, type: "email", label: "Email for follow-up (optional)", required: false, config: { placeholder: "you@company.com" } },
    ],
    responses: [
      { answers: { [f1]: "Founder", [f2]: "b", [f3]: 9, [f4]: "a", [f5]: "We needed a fast way to run user research without engineering bandwidth. FormBlox let us ship a survey in 10 minutes.", [f6]: "a", [f7]: "founder@startup.io" }, followups: [{ fieldId: f5, aiQuestion: "What was the biggest bottleneck before you found FormBlox?", userAnswer: "Every form change required a dev ticket. We'd lose days just tweaking questions." }] },
      { answers: { [f1]: "Product Manager", [f2]: "c", [f3]: 8, [f4]: "b", [f5]: "I wanted analytics that showed where users drop off in our onboarding flow. Most tools just give me a spreadsheet.", [f6]: "a", [f7]: "" }, followups: [{ fieldId: f5, aiQuestion: "What kind of analytics insights are most valuable to you as a PM?", userAnswer: "Drop-off rates per question and average completion time. I want to know which question kills the form." }] },
      { answers: { [f1]: "Designer", [f2]: "a", [f3]: 9, [f4]: "c", [f5]: "We run a design agency and needed forms that could match our clients' brand identity.", [f6]: "a", [f7]: "design@agency.co" } },
      { answers: { [f1]: "Engineer", [f2]: "d", [f3]: 7, [f4]: "d", [f5]: "Looking for a form backend with a proper API so we could embed forms in our own app.", [f6]: "b", [f7]: "" } },
      { answers: { [f1]: "Growth Lead", [f2]: "e", [f3]: 9, [f4]: "a", [f5]: "We run weekly NPS surveys. Writing the same questions every month was tedious — AI generation sounded too good to be true.", [f6]: "a", [f7]: "growth@saas.com" }, followups: [{ fieldId: f5, aiQuestion: "Did AI generation meet your expectations for NPS survey creation?", userAnswer: "It nailed the questions on the first try. I just tweaked the wording slightly." }] },
      { answers: { [f1]: "Startup Founder", [f2]: "b", [f3]: 8, [f4]: "b", [f5]: "Needed something between a Google Form and Typeform — free to start, but not embarrassing to send to investors.", [f6]: "a", [f7]: "" } },
      { answers: { [f1]: "Head of Ops", [f2]: "c", [f3]: 7, [f4]: "d", [f5]: "We needed forms that could feed into our CRM automatically. The API was the deciding factor.", [f6]: "b", [f7]: "" } },
      { answers: { [f1]: "Developer Advocate", [f2]: "a", [f3]: 9, [f4]: "d", [f5]: "I evaluate form tools for the developer community. FormBlox's tRPC-based API is surprisingly clean.", [f6]: "a", [f7]: "devrel@community.dev" }, followups: [{ fieldId: f5, aiQuestion: "How does FormBlox's API compare to alternatives you've evaluated?", userAnswer: "Type safety out of the box is rare. Most form APIs return untyped JSON blobs." }] },
      { answers: { [f1]: "Marketing Manager", [f2]: "e", [f3]: 8, [f4]: "a", [f5]: "We run event registration forms. I tried building one with AI generation for a hackathon and it worked perfectly.", [f6]: "a", [f7]: "" } },
      { answers: { [f1]: "CTO", [f2]: "b", [f3]: 9, [f4]: "d", [f5]: "I was demo-ing form tools to our team and FormBlox was the only one where the AI generation actually produced usable output.", [f6]: "a", [f7]: "cto@techco.io" } },
      { answers: { [f1]: "UX Researcher", [f2]: "c", [f3]: 8, [f4]: "b", [f5]: "I run qualitative studies and needed a tool that shows AI follow-up questions inline — something no other tool does.", [f6]: "a", [f7]: "" }, followups: [{ fieldId: f5, aiQuestion: "How has the AI follow-up feature changed the quality of your research responses?", userAnswer: "I get 3x more context per response. Participants elaborate more when prompted with a relevant follow-up." }] },
      { answers: { [f1]: "Freelancer", [f2]: "a", [f3]: 7, [f4]: "c", [f5]: "Client intake forms were always painful to set up. FormBlox made it feel effortless.", [f6]: "b", [f7]: "" } },
      { answers: { [f1]: "SaaS Founder", [f2]: "b", [f3]: 9, [f4]: "a", [f5]: "We needed churn survey forms fast. AI generated a 6-question form in 30 seconds that was better than what I'd have written.", [f6]: "a", [f7]: "founder2@saas.co" } },
      { answers: { [f1]: "Data Analyst", [f2]: "d", [f3]: 8, [f4]: "b", [f5]: "I needed the response data to be structured and exportable. FormBlox stores answers as proper JSON per field.", [f6]: "a", [f7]: "" } },
      { answers: { [f1]: "Community Manager", [f2]: "c", [f3]: 9, [f4]: "a", [f5]: "We run member onboarding surveys for a 5k+ community. AI generation cut our form-creation time to near zero.", [f6]: "a", [f7]: "community@org.io" } },
    ],
  });
}

// ─── Form 3: Game Preferences Poll (unlisted) ──────────────────────────────
{
  const f1 = fieldId(), f2 = fieldId(), f3 = fieldId(), f4 = fieldId(), f5 = fieldId(), f6 = fieldId();
  FORMS.push({
    title: "Gamer Preferences Poll",
    description: "Quick 6-question survey about your gaming habits. Takes under 2 minutes.",
    visibility: "public",
    fields: [
      { id: f1, type: "single_choice", label: "Primary gaming platform?", required: true, config: { options: [{ id: "a", label: "PC" }, { id: "b", label: "PlayStation" }, { id: "c", label: "Xbox" }, { id: "d", label: "Nintendo Switch" }, { id: "e", label: "Mobile" }], randomize: false } },
      { id: f2, type: "multiple_choice", label: "Which genres do you play most? (pick up to 3)", required: true, config: { options: [{ id: "a", label: "RPG" }, { id: "b", label: "FPS" }, { id: "c", label: "Strategy" }, { id: "d", label: "Indie" }, { id: "e", label: "Sports" }, { id: "f", label: "Horror" }], randomize: false, min: 1, max: 3 } },
      { id: f3, type: "number", label: "Hours per week you game (approx)", required: true, config: { placeholder: "e.g. 10", min: 0, max: 168 } },
      { id: f4, type: "rating", label: "Rate your current favourite game (1-5)", required: true, config: { scale: 5, style: "star" } },
      { id: f5, type: "short_text", label: "Name your current favourite game", required: true, config: { placeholder: "e.g. Elden Ring" } },
      { id: f6, type: "long_text", label: "What would make your ideal game? Describe it.", required: false, config: { placeholder: "Open world, co-op, story-driven…", maxLength: 400 } },
    ],
    responses: [
      { answers: { [f1]: "a", [f2]: ["a", "d"], [f3]: 20, [f4]: 5, [f5]: "Elden Ring", [f6]: "Open world with deep lore and punishing but fair combat. No hand-holding." }, followups: [{ fieldId: f6, aiQuestion: "What specific mechanic in Elden Ring made you feel the most rewarded?", userAnswer: "Killing a boss after 30 attempts and finally understanding its patterns." }] },
      { answers: { [f1]: "b", [f2]: ["b", "a"], [f3]: 15, [f4]: 5, [f5]: "God of War Ragnarok", [f6]: "Epic cinematic story with satisfying combat evolution and emotional depth." } },
      { answers: { [f1]: "a", [f2]: ["b"], [f3]: 25, [f4]: 5, [f5]: "CS2", [f6]: "Tight gunplay, competitive ranking system, low TTK. CS2 is nearly perfect." }, followups: [{ fieldId: f6, aiQuestion: "What keeps you coming back to CS2 over other FPS games?", userAnswer: "The skill ceiling is basically infinite. I've played 4000 hours and I'm still learning." }] },
      { answers: { [f1]: "d", [f2]: ["a", "d"], [f3]: 10, [f4]: 5, [f5]: "Zelda: Tears of the Kingdom", [f6]: "Sandbox freedom where creativity IS the gameplay. TOTK nailed this." } },
      { answers: { [f1]: "a", [f2]: ["c", "a"], [f3]: 12, [f4]: 4, [f5]: "Civilization VI", [f6]: "Deep strategy, replayable civilizations, emergent storytelling through systems." }, followups: [{ fieldId: f6, aiQuestion: "Which Civ VI mechanic creates the most unexpected stories for you?", userAnswer: "Diplomacy. Every run ends with a completely different set of alliances and betrayals." }] },
      { answers: { [f1]: "a", [f2]: ["d"], [f3]: 8, [f4]: 5, [f5]: "Hades", [f6]: "A roguelike with actual narrative progression. The writing is better than most AAA games." } },
      { answers: { [f1]: "c", [f2]: ["b", "a"], [f3]: 18, [f4]: 5, [f5]: "Halo Infinite", [f6]: "Arena shooter feel with modern maps. Campaign could be better but multiplayer is back." } },
      { answers: { [f1]: "e", [f2]: ["e", "b"], [f3]: 7, [f4]: 4, [f5]: "Clash Royale", [f6]: "Fast sessions, deep meta, works on any phone. Perfect for commuting." } },
      { answers: { [f1]: "b", [f2]: ["a", "f"], [f3]: 14, [f4]: 5, [f5]: "Bloodborne", [f6]: "Gothic horror atmosphere, fast paced combat, mysteries you still find after 200 hours." }, followups: [{ fieldId: f6, aiQuestion: "What aspect of Bloodborne's world design has stuck with you the most?", userAnswer: "The way Yharnam feels alive but doomed. Every NPC you meet is slowly going mad." }] },
      { answers: { [f1]: "a", [f2]: ["a", "c"], [f3]: 22, [f4]: 5, [f5]: "Baldur's Gate 3", [f6]: "Reactive world, meaningful choices, companion depth. GOTY is an understatement." } },
      { answers: { [f1]: "a", [f2]: ["d", "a"], [f3]: 6, [f4]: 4, [f5]: "Stardew Valley", [f6]: "Cozy, no pressure, endlessly relaxing. The antidote to stressful games." } },
      { answers: { [f1]: "b", [f2]: ["a"], [f3]: 16, [f4]: 5, [f5]: "Final Fantasy XVI", [f6]: "Action combat in a mainline FF game was overdue. The Eikon fights are stunning." } },
      { answers: { [f1]: "a", [f2]: ["b", "d"], [f3]: 30, [f4]: 5, [f5]: "Hollow Knight", [f6]: "Metroidvania perfection. The atmosphere is oppressive in the best way." }, followups: [{ fieldId: f6, aiQuestion: "How does Hollow Knight's environmental storytelling compare to other indie games you've played?", userAnswer: "It trusts you to piece the lore together yourself. No hand-holding, just evidence." }] },
      { answers: { [f1]: "c", [f2]: ["b"], [f3]: 20, [f4]: 4, [f5]: "Forza Horizon 5", [f6]: "Open world racing with absurd car variety and stunning environments." } },
      { answers: { [f1]: "d", [f2]: ["d", "a"], [f3]: 9, [f4]: 5, [f5]: "Hollow Knight: Silksong", [f6]: "Still waiting. But when it arrives — a hand-crafted metroidvania with incredible polish." } },
      { answers: { [f1]: "a", [f2]: ["a", "c", "d"], [f3]: 35, [f4]: 5, [f5]: "Dwarf Fortress", [f6]: "Complete simulation sandbox. The stories it generates are impossible to script." } },
      { answers: { [f1]: "b", [f2]: ["b", "a"], [f3]: 12, [f4]: 5, [f5]: "Spider-Man 2", [f6]: "Web-swinging feels incredible. The traversal alone is worth the price." } },
      { answers: { [f1]: "a", [f2]: ["d", "f"], [f3]: 7, [f4]: 5, [f5]: "Disco Elysium", [f6]: "A game that respects your intelligence. Pure dialogue, pure consequence." }, followups: [{ fieldId: f6, aiQuestion: "Which skill or voice in Disco Elysium resonated with you the most?", userAnswer: "Ancient Reptilian Brain. It was wrong about everything and I trusted it anyway." }] },
      { answers: { [f1]: "a", [f2]: ["a", "d"], [f3]: 11, [f4]: 4, [f5]: "Celeste", [f6]: "Precision platformer with a genuinely moving story about anxiety and perseverance." } },
      { answers: { [f1]: "e", [f2]: ["b"], [f3]: 5, [f4]: 4, [f5]: "PUBG Mobile", [f6]: "Battle royale on mobile done right. Tense, strategic, rewarding." } },
    ],
  });
}

// ─── main ──────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Starting seed…");

  // 1. Upsert demo user
  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, DEMO_EMAIL)).limit(1);

  if (!user) {
    console.log("  Creating demo user…");
    [user] = await db
      .insert(usersTable)
      .values({ fullName: DEMO_NAME, email: DEMO_EMAIL, emailVerified: true })
      .returning();

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    await db.insert(userCredentialsTable).values({ userId: user!.id, passwordHash });
  } else {
    console.log("  Demo user exists — skipping creation");
    // Ensure emailVerified
    await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.id, user.id));
  }

  // 2. Upsert workspace
  let [workspace] = await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.createdBy, user!.id))
    .limit(1);

  if (!workspace) {
    console.log("  Creating workspace…");
    [workspace] = await db
      .insert(workspacesTable)
      .values({ name: `${DEMO_NAME}'s Workspace`, createdBy: user!.id })
      .returning();
    await db.insert(workspaceMembersTable).values({ workspaceId: workspace!.id, userId: user!.id, role: "owner" });
  } else {
    console.log("  Workspace exists — skipping creation");
  }

  // 3. Seed forms
  for (const formDef of FORMS) {
    // Idempotent: skip if a form with this title already exists in the workspace
    const existing = await db
      .select({ id: formsTable.id })
      .from(formsTable)
      .innerJoin(formVersionsTable, and(eq(formVersionsTable.formId, formsTable.id), eq(formVersionsTable.title, formDef.title)))
      .where(eq(formsTable.workspaceId, workspace!.id))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  Skipping existing form: "${formDef.title}"`);
      continue;
    }

    console.log(`  Seeding form: "${formDef.title}"`);

    // Create form
    const [form] = await db
      .insert(formsTable)
      .values({ workspaceId: workspace!.id, publicSlug: nanoid(10), visibility: formDef.visibility })
      .returning();

    // Create published version
    const [version] = await db
      .insert(formVersionsTable)
      .values({
        formId: form!.id,
        versionNumber: 1,
        status: "published",
        title: formDef.title,
        description: formDef.description,
        publishedAt: new Date(),
      })
      .returning();

    // Create draft (required by DB constraint: one draft per form)
    await db.insert(formVersionsTable).values({
      formId: form!.id,
      versionNumber: 2,
      status: "draft",
      title: formDef.title,
      description: formDef.description,
    });

    // Insert fields
    await db.insert(formFieldsTable).values(
      formDef.fields.map((f, i) => ({
        id: f.id,
        formVersionId: version!.id,
        order: i,
        type: f.type,
        label: f.label,
        required: f.required,
        config: f.config,
      })),
    );

    // Insert responses
    for (const resp of formDef.responses) {
      const [response] = await db
        .insert(responsesTable)
        .values({
          formVersionId: version!.id,
          responseToken: nanoid(),
          startedAt: randomDate(30),
          completedAt: randomDate(30),
          lastActivityAt: new Date(),
        })
        .returning();

      const answerEntries = Object.entries(resp.answers).filter(([, v]) => v !== "" && v !== null && v !== undefined);
      if (answerEntries.length > 0) {
        await db.insert(responseAnswersTable).values(
          answerEntries.map(([fieldId, value]) => ({
            responseId: response!.id,
            fieldId,
            value: value as Record<string, unknown>,
          })),
        );
      }

      if (resp.followups && resp.followups.length > 0) {
        await db.insert(aiFollowupsTable).values(
          resp.followups.map((fu) => ({
            responseId: response!.id,
            fieldId: fu.fieldId,
            aiQuestion: fu.aiQuestion,
            userAnswer: fu.userAnswer,
          })),
        );
      }
    }

    console.log(`    ✓ ${formDef.responses.length} responses seeded`);
  }

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
