import { guard } from "../../guard";
import { Card, PageTitle } from "../../ui";
import EventForm from "../EventForm";

export default async function NewEvent() {
  await guard();
  return (
    <>
      <PageTitle title="New event" />
      <Card>
        <EventForm
          id={null}
          d={{
            title: "",
            subtitle: "",
            description: "",
            category: "Bhajan Sandhya",
            startsAt: "",
            endsAt: "",
            gatesOpenAt: "",
            venueName: "",
            address: "",
            city: "Indore",
            mapUrl: "",
            posterUrl: "",
            status: "DRAFT",
            ticketTypes: [],
          }}
        />
      </Card>
    </>
  );
}
