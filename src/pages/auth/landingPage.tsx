import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/authContext";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText"; // or "gsap-trial/SplitText"

gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(SplitText);

const Landing = () => {
  const navigate = useNavigate();
  const { theme } = useAuth();
  const headingRef = useRef(null);

  useEffect(() => {

    if (headingRef.current) {
      const split = new SplitText(headingRef.current, { type: "words,chars" });
      gsap.from(split.words, {
        y: 50,
        duration: 1,
        ease: "power3.out",
        stagger: 0.1
      });

      gsap.from(split.chars, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.02,
        delay: 0.1 // Slight sync delay
      });
      // gsap.from(split.chars, {
      //   x: 250,
      //   opacity: 0,
      //   duration: 0.7,
      //   ease: "power4",
      //   stagger: 0.04,
      //   // We add a slight delay so it doesn't start until the page is fully ready
      //   delay: 0.2
      // });
    }

    const elements = gsap.utils.toArray<HTMLElement>(".fade-up");
    elements.forEach((el) => {
      gsap.fromTo(
        el,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
          },
        }
      );
    });

    const warehouse = document.querySelector<HTMLElement>(".warehouse-image");
    const warehouseContent = document.querySelectorAll<HTMLElement>(".warehouse-content");
    if (warehouse) {
      gsap.fromTo(
        warehouse,
        { scale: 1.05, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: warehouse,
            start: "top 75%",
          },
        }
      );
    }
    if (warehouseContent.length) {
      gsap.fromTo(
        warehouseContent,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".warehouse-section",
            start: "top 80%",
          },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);


  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <header
        className="sticky top-0 z-20"
        style={{ backgroundColor: theme.background }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4" >
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-xl"
              style={{ backgroundColor: theme.surfaceAlt, color: theme.primary }}
            >
              🧁
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold tracking-tight">
                PantryPilot
              </span>
              <span
                className="text-xs"
                style={{ color: theme.textMuted }}
              >
                Inventory Management
              </span>
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <label
              className="transition-colors hover:opacity-60"
              style={{ color: theme.text, fontWeight: 500 }}
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Features
            </label>
            <label
              className="transition-colors hover:opacity-60"
              style={{ color: theme.text, fontWeight: 500 }}
              onClick={() =>
                document
                  .getElementById("workflow")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Workflow
            </label>
            <label
              className="transition-colors hover:opacity-60"
              style={{ color: theme.text, fontWeight: 500 }}
              onClick={() =>
                document
                  .getElementById("insights")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Insights
            </label>
          </nav>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="rounded-full px-5 py-2 text-sm font-semibold shadow-md transition hover:opacity-90"
            style={{
              backgroundColor: theme.primary,
              color: theme.primaryText,
              borderColor: theme.primary,
            }}
          >
            Try for free
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <section className="flex min-h-[70vh] flex-col items-center justify-center gap-10 pb-16 pt-12 md:flex-row md:justify-between">
          <div className="fade-up max-w-xl space-y-6">

            <h1
              ref={headingRef}
              className="text-balance overflow-hidden py-2 text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
              style={{ color: theme.text }}
            >
              Stay ahead of every ingredient, order, and recipe.
            </h1>
            <p
              className="text-base sm:text-lg"
              style={{ color: theme.textMuted }}
            >
              PantryPilot keeps your stock accurate in real time, connects
              inventory to recipes and orders, and gives you a clear view of
              what&apos;s happening in your kitchen.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold shadow-lg transition hover:opacity-90"
                style={{
                  backgroundColor: theme.primary,
                  color: theme.primaryText,
                  borderColor: theme.primary,
                }}
              >
                Try for free
              </button>
              <p
                className="text-xs"
                style={{ color: theme.textMuted }}
              >
                No credit card required. Start tracking inventory in minutes.
              </p>
            </div>
          </div>
          <div
            className="fade-up mt-6 w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1549488344-cab7d6164423?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Home baking ingredients and fresh pastries"
              className="warehouse-image h-full w-full object-cover"
            />
          </div>
        </section>

        <section className="warehouse-section flex flex-col items-center gap-10 py-16 md:flex-row">
          <div
            className="warehouse-image w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
            }}
          >
            <img
              src="https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Warehouse shelves with organized inventory"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="w-full max-w-md space-y-4">
            <p
              className="warehouse-content text-xs font-semibold uppercase tracking-wide"
              style={{ color: theme.secondary }}
            >
              Real-world operations
            </p>
            <h2
              className="warehouse-content text-2xl font-semibold sm:text-3xl"
              style={{ color: theme.text }}
            >
              See your warehouse the way your team moves through it.
            </h2>
            <p
              className="warehouse-content text-sm sm:text-base"
              style={{ color: theme.textMuted }}
            >
              From raw ingredients on palettes to finished goods on racks,
              PantryPilot keeps every shelf, bin, and container in sync with
              your digital inventory.
            </p>
            <ul
              className="warehouse-content space-y-2 text-sm"
              style={{ color: theme.text }}
            >
              <li>Map ingredients to locations so stock checks are fast.</li>
              <li>Track what moves in and out of storage in real time.</li>
              <li>Spot bottlenecks before they impact production schedules.</li>
            </ul>
          </div>
        </section>

        <section
          id="features"
          className="fade-up border-y py-16"
          style={{ borderColor: theme.border }}
        >
          <div className="mb-8 text-center">
            <h2
              className="text-2xl font-semibold sm:text-3xl"
              style={{ color: theme.text }}
            >
              Built for real inventory workflows
            </h2>
            <p
              className="mt-2 text-sm sm:text-base"
              style={{ color: theme.textMuted }}
            >
              Everything you need to keep shelves stocked, recipes consistent,
              and waste under control.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div
              className="rounded-xl border p-5"
              style={{ borderColor: theme.border, backgroundColor: theme.surface }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ color: theme.text }}
              >
                Inventory tracking
              </h3>
              <p
                className="mt-2 text-sm"
                style={{ color: theme.textMuted }}
              >
                Track every ingredient with units, weights, and quantities so
                you always know what is on hand.
              </p>
            </div>
            <div
              className="rounded-xl border p-5"
              style={{ borderColor: theme.border, backgroundColor: theme.surface }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ color: theme.text }}
              >
                Recipes
              </h3>
              <p
                className="mt-2 text-sm"
                style={{ color: theme.textMuted }}
              >
                Connect recipes to inventory items and automatically calculate
                usage per batch.
              </p>
            </div>
            <div
              className="rounded-xl border p-5"
              style={{ borderColor: theme.border, backgroundColor: theme.surface }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ color: theme.text }}
              >
                Orders and costing
              </h3>
              <p
                className="mt-2 text-sm"
                style={{ color: theme.textMuted }}
              >
                See how each order affects stock and understand the cost of
                every product you sell.
              </p>
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="fade-up flex flex-col gap-10 py-16 md:flex-row md:items-center"
        >
          <div className="max-w-md space-y-4">
            <h2
              className="text-2xl font-semibold sm:text-3xl"
              style={{ color: theme.text }}
            >
              A clear flow from purchase order to finished product.
            </h2>
            <p
              className="text-sm sm:text-base"
              style={{ color: theme.textMuted }}
            >
              PantryPilot mirrors how your team works so you do not have to
              fight your tools. Keep everything flowing from receiving to
              production to sale.
            </p>
          </div>
          <ol
            className="grid flex-1 gap-4 text-sm md:grid-cols-3"
            style={{ color: theme.text }}
          >
            <li
              className="rounded-lg border p-4"
              style={{ borderColor: theme.border, backgroundColor: theme.surface }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: theme.textMuted }}
              >
                Step 1
              </p>
              <p
                className="mt-1 font-medium"
                style={{ color: theme.text }}
              >
                Add inventory
              </p>
              <p
                className="mt-1 text-xs"
                style={{ color: theme.textMuted }}
              >
                Capture ingredients with units, weights, and quantities in one
                place.
              </p>
            </li>
            <li
              className="rounded-lg border p-4"
              style={{ borderColor: theme.border, backgroundColor: theme.surface }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: theme.textMuted }}
              >
                Step 2
              </p>
              <p
                className="mt-1 font-medium"
                style={{ color: theme.text }}
              >
                Define recipes
              </p>
              <p
                className="mt-1 text-xs"
                style={{ color: theme.textMuted }}
              >
                Link ingredients to recipes once and let PantryPilot handle the
                math.
              </p>
            </li>
            <li
              className="rounded-lg border p-4"
              style={{ borderColor: theme.border, backgroundColor: theme.surface }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: theme.textMuted }}
              >
                Step 3
              </p>
              <p
                className="mt-1 font-medium"
                style={{ color: theme.text }}
              >
                Track orders
              </p>
              <p
                className="mt-1 text-xs"
                style={{ color: theme.textMuted }}
              >
                See stock change automatically as new orders come in and are
                fulfilled.
              </p>
            </li>
          </ol>
        </section>

        <section
          id="insights"
          className="fade-up border-t py-16"
          style={{ borderColor: theme.border }}
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h2
                className="text-2xl font-semibold sm:text-3xl"
                style={{ color: theme.text }}
              >
                Understand your inventory at a glance.
              </h2>
              <p
                className="text-sm sm:text-base"
                style={{ color: theme.textMuted }}
              >
                Quickly see which items need attention, which recipes drive most
                of your usage, and how orders are impacting stock levels.
              </p>
              <ul
                className="space-y-2 text-sm"
                style={{ color: theme.text }}
              >
                <li>Low stock alerts before you run out of key ingredients.</li>
                <li>
                  Visibility into which products consume the most inventory.
                </li>
                <li>Consistent recipes that keep quality and cost in check.</li>
              </ul>
            </div>
            <div
              className="rounded-2xl border p-5 text-sm"
              style={{ borderColor: theme.border, backgroundColor: theme.surface }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span
                  className="font-medium"
                  style={{ color: theme.text }}
                >
                  Inventory health
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: theme.surfaceAlt,
                    color: theme.primary,
                  }}
                >
                  Stable
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: theme.text }}>Items at healthy stock</span>
                  <span
                    className="font-semibold"
                    style={{ color: theme.primary }}
                  >
                    87%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: theme.text }}>
                    Items to reorder soon
                  </span>
                  <span className="font-semibold text-amber-300">9%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: theme.text }}>Critical low stock</span>
                  <span className="font-semibold text-rose-300">4%</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer
        className="border-t"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.surfaceAlt,
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs sm:flex-row">
          <p style={{ color: theme.textMuted }}>
            © {new Date().getFullYear()} PantryPilot. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span style={{ color: theme.textMuted }}>Inventory made simple.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
