import { Rating } from "@/components/ui/Rating";

const TESTIMONIALS = [
  {
    name: "Brian Otieno",
    role: "Software Developer, Nairobi",
    body: "Ordered a Dell XPS and it arrived next day. Genuine, sealed and well-priced. My go-to tech store now.",
    rating: 5,
  },
  {
    name: "Amina Yusuf",
    role: "Graphic Designer, Mombasa",
    body: "The MacBook I bought is flawless and the M-Pesa checkout was so smooth. Excellent customer support too.",
    rating: 5,
  },
  {
    name: "Kevin Mwangi",
    role: "Gamer & Streamer",
    body: "Got my ROG Strix at a flash-sale price. Delivery was quick and the packaging was premium. Highly recommend!",
    rating: 4,
  },
];

export function Testimonials() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {TESTIMONIALS.map((t) => (
        <figure key={t.name} className="card flex h-full flex-col p-6">
          <Rating value={t.rating} size="md" />
          <blockquote className="mt-4 flex-1 text-sm text-slate-600 dark:text-slate-300">
            “{t.body}”
          </blockquote>
          <figcaption className="mt-5">
            <p className="font-semibold text-secondary dark:text-white">{t.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
