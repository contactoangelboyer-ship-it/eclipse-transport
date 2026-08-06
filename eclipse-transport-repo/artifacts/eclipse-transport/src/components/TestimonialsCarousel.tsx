import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    name: "James R.",
    initials: "JR",
    title: "Film Producer",
    location: "Beverly Hills",
    quote:
      "The only service I trust for my talent. Their discretion and punctuality are unmatched in LA. The Suburban is always pristine — it arrives like clockwork, every single time.",
    vehicle: "Chevrolet Suburban",
    color: "#1A1A1A",
  },
  {
    name: "Sarah M.",
    initials: "SM",
    title: "CEO",
    location: "Santa Monica",
    quote:
      "I use Eclipse for all my airport transfers. They track my flights, so even when I land 30 minutes early, my driver is already at the curb waiting. Pure peace of mind.",
    vehicle: "Cadillac Escalade ESV",
    color: "#1A1A1A",
  },
  {
    name: "David L.",
    initials: "DL",
    title: "Event Director",
    location: "West Hollywood",
    quote:
      "We booked 4 vehicles for a corporate retreat. The coordination was flawless and the chauffeurs were incredibly professional. It felt like a choreographed operation.",
    vehicle: "Full Fleet",
    color: "#1A1A1A",
  },
  {
    name: "Elena K.",
    initials: "EK",
    title: "Private Client",
    location: "Malibu",
    quote:
      "A truly quiet, seamless experience. The S-Class was immaculate and the driver navigated PCH traffic like a ghost. I arrived completely relaxed and ahead of schedule.",
    vehicle: "Mercedes-Benz S-Class",
    color: "#1A1A1A",
  },
  {
    name: "Michael T.",
    initials: "MT",
    title: "Tech Executive",
    location: "Playa Vista",
    quote:
      "Booking is effortless. The communication from dispatch is crystal clear, and the flat rates to LAX mean zero surprises. This is what premium service should feel like.",
    vehicle: "Lincoln Continental",
    color: "#1A1A1A",
  },
  {
    name: "Jessica W.",
    initials: "JW",
    title: "Bride",
    location: "Pasadena",
    quote:
      "They handled our entire wedding party transportation perfectly. The Escalade was gorgeous and the chauffeur was so patient and accommodating. An unforgettable day.",
    vehicle: "Cadillac Escalade ESV",
    color: "#1A1A1A",
  },
];

const AUTOPLAY_DURATION = 5000;

export function TestimonialsCarousel() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragX = useMotionValue(0);

  const goTo = useCallback(
    (index: number, dir?: number) => {
      const resolvedDir = dir ?? (index > active ? 1 : -1);
      setDirection(resolvedDir);
      setActive(index);
      setProgressKey((k) => k + 1);
    },
    [active]
  );

  const next = useCallback(() => {
    goTo((active + 1) % testimonials.length, 1);
  }, [active, goTo]);

  const prev = useCallback(() => {
    goTo((active - 1 + testimonials.length) % testimonials.length, -1);
  }, [active, goTo]);

  useEffect(() => {
    if (isHovered) return;
    timerRef.current = setInterval(next, AUTOPLAY_DURATION);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next, isHovered]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -60) next();
    else if (info.offset.x > 60) prev();
  };

  const current = testimonials[active];

  const variants = {
    enter: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 48 : -48,
      filter: "blur(4px)",
    }),
    center: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? -48 : 48,
      filter: "blur(4px)",
    }),
  };

  return (
    <section
      className="relative py-28 md:py-36 bg-[#0F0F0F] overflow-hidden"
      data-testid="section-testimonials"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ambient background glow */}
      <motion.div
        key={active}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 80%, rgba(255,255,255,0.04) 0%, transparent 100%)`,
        }}
      />

      {/* Decorative grid lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-4">
            Client Voices
          </p>
          <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight">
            What our clients say
          </h2>
        </motion.div>

        {/* Quote card */}
        <div className="relative min-h-[280px] md:min-h-[260px]">
          {/* Giant decorative quote mark */}
          <motion.div
            key={`quote-${active}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.06, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="absolute -top-8 -left-4 md:-left-8 pointer-events-none select-none"
          >
            <Quote className="w-32 h-32 md:w-48 md:h-48 text-white" strokeWidth={0.5} />
          </motion.div>

          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={active}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              className="relative cursor-grab active:cursor-grabbing select-none"
            >
              {/* Stars */}
              <div className="flex gap-1.5 mb-8 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.div
                    key={star}
                    initial={{ opacity: 0, scale: 0.3, rotate: -20 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: star * 0.07,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <Star className="w-4 h-4 fill-white/80 text-white/80" />
                  </motion.div>
                ))}
              </div>

              {/* Quote text */}
              <p className="text-xl md:text-2xl lg:text-3xl font-light text-white/90 leading-relaxed tracking-tight text-center max-w-3xl mx-auto mb-10">
                "{current.quote}"
              </p>

              {/* Author */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-4">
                  <div className="w-[1px] h-6 bg-white/20" />
                  <div className="text-center">
                    <p className="font-medium text-white text-sm">{current.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mt-0.5">
                      {current.title} · {current.location}
                    </p>
                  </div>
                  <div className="w-[1px] h-6 bg-white/20" />
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                  className="mt-1 px-3 py-1 bg-white/5 border border-white/10 rounded-full"
                >
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-bold">
                    {current.vehicle}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls row */}
        <div className="mt-14 md:mt-16 flex flex-col items-center gap-8">
          {/* Avatar selector */}
          <div className="flex items-center gap-3 md:gap-4">
            {testimonials.map((t, i) => (
              <motion.button
                key={i}
                onClick={() => goTo(i)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.93 }}
                className="relative focus:outline-none"
                aria-label={`Show testimonial from ${t.name}`}
              >
                {/* Active ring */}
                <AnimatePresence>
                  {i === active && (
                    <motion.div
                      layoutId="active-ring"
                      className="absolute -inset-1 rounded-full border-2 border-white/60"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </AnimatePresence>
                <div
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[11px] font-bold uppercase tracking-wide transition-all duration-300 ${
                    i === active
                      ? "bg-white text-[#0F0F0F] shadow-lg"
                      : "bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/70"
                  }`}
                >
                  {t.initials}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Prev / Next + progress */}
          <div className="flex items-center gap-6">
            <motion.button
              onClick={prev}
              whileHover={{ scale: 1.08, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-colors focus:outline-none"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>

            {/* Progress bar */}
            <div className="relative w-32 md:w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
              <motion.div
                key={progressKey}
                className="absolute inset-y-0 left-0 bg-white/70 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: isHovered ? undefined : "100%" }}
                transition={{ duration: AUTOPLAY_DURATION / 1000, ease: "linear" }}
              />
            </div>

            <motion.button
              onClick={next}
              whileHover={{ scale: 1.08, x: 2 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-colors focus:outline-none"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Counter */}
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/20">
            {String(active + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}
          </p>
        </div>
      </div>
    </section>
  );
}
