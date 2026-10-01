import { getTestimonials } from "@/lib/testimonials";
import { guard } from "../guard";
import { Card, PageTitle } from "../ui";
import { deleteTestimonial } from "../actions";
import TestimonialForm from "./TestimonialForm";

export const dynamic = "force-dynamic";

export default async function AdminTestimonials() {
  await guard();
  const list = await getTestimonials();
  return (
    <>
      <PageTitle title="Testimonials" />
      <p className="-mt-3 mb-5 text-sm text-ink/60">
        Words from organisers and devotees. They appear on the Home page as &quot;भक्तों के अनुभव&quot;. The section stays hidden until you add the first one. Only add real messages, with
        permission.
      </p>
      <Card className="mb-6">
        <TestimonialForm />
      </Card>
      <div className="space-y-3">
        {list.map((t) => (
          <Card key={t.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-hindi text-lg leading-relaxed">“{t.text}”</p>
                <p className="mt-2 text-sm text-ink/60">
                  {t.name}
                  {t.place && ` · ${t.place}`}
                  {t.occasion && ` · ${t.occasion}`}
                </p>
              </div>
              <form action={deleteTestimonial.bind(null, t.id)}>
                <button className="text-sm text-kumkum">Delete</button>
              </form>
            </div>
          </Card>
        ))}
        {list.length === 0 && <Card className="text-center text-ink/50">No testimonials yet.</Card>}
      </div>
    </>
  );
}
