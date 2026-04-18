import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import vamosLogo from "@/assets/vamos_logo.png";

const STAGES = [
  {
    slug: "explore" as const,
    title: "Explore",
    description: "Discover pathways you have not considered yet and build clarity from curiosity.",
  },
  {
    slug: "plan" as const,
    title: "Plan",
    description: "Turn a direction into a practical roadmap, with next steps that fit your semester.",
  },
  {
    slug: "build" as const,
    title: "Build",
    description: "Get specific ideas for experiences, projects, and skills that open real options.",
  },
  {
    slug: "reflect" as const,
    title: "Reflect",
    description: "Make sense of what you have tried, spot patterns, and refine what matters to you.",
  },
] as const;

export default function Landing() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3" aria-label="Vamos Careers home">
            <img
              src={vamosLogo}
              alt="Vamos Careers"
              className="block h-28 w-auto sm:h-32"
              loading="eager"
              decoding="async"
            />
          </Link>

          <Button asChild variant="secondary" className="rounded-full">
            <Link to="/pathfinder">Try Pathfinder</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <section className="grid items-center gap-10 py-6 md:grid-cols-2 md:py-10">
          <div className="space-y-6">
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Career navigation for the students who need it most.
            </h1>

            <p className="max-w-prose text-pretty text-base text-muted-foreground sm:text-lg">
              Vamos Careers is a platform built to help college students from underserved backgrounds explore career
              options, find direction, and take confident next steps. Our flagship product, Vamos Pathfinder, is an AI
              powered career navigation tool that meets students where they are.
            </p>

            <div className="flex flex-col gap-3">
              <Button asChild className="w-fit rounded-full px-6">
                <Link to="/pathfinder">Start exploring with Pathfinder</Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Includes an interactive career map and personalised action plan.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">What is Vamos Pathfinder?</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Pathfinder guides students through four stages so they can build clarity first, then momentum.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {STAGES.map((stage) => (
                  <Link
                    key={stage.slug}
                    to={`/pathfinder?stage=${stage.slug}`}
                    className="block rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                      <div className="font-medium">{stage.title}</div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{stage.description}</p>
                    <span className="mt-3 inline-block text-sm font-medium text-primary">Open Pathfinder →</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-border bg-muted/30 p-6 sm:p-10">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <h2 className="text-2xl font-semibold tracking-tight">A simple method, built for real constraints</h2>
            </div>
            <div className="md:col-span-2">
              <p className="text-base leading-relaxed text-muted-foreground">
                Students do not need another generic job board. They need help connecting their interests and experiences
                to concrete pathways, and they need next steps that are specific, realistic, and supportive. Pathfinder
                is designed to do that, quickly, in a conversation.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild variant="secondary" className="rounded-full">
                  <Link to="/pathfinder">Open Pathfinder</Link>
                </Button>
                <span className="text-sm text-muted-foreground">
                  Explore, then plan and build from there.
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <span>© {new Date().getFullYear()} Vamos Careers</span>
          <span>Vamos Careers</span>
        </div>
      </footer>
    </div>
  );
}

