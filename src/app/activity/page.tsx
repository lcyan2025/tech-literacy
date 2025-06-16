export const revalidate = 60;

import Breadcrumb from "@/components/breadcrumb/breadcrumb";
import Announcement from "@/components/announcement/announcement";

import { findRouteData } from "@/utils/notion";

const Page: React.FC = async () => {
  const data = await findRouteData("/activity");
  const ActivityAnnouncement = data.Announcement.find(
    ({ name }: any) => name === "ActivityAnnouncement"
  );

  return (
    <main>
      <section>
        <div className="container py-8 md:py-16 pb-4 md:pb-8">
          <h1 className="font-semibold text-3xl md:text-4xl text-center">
            活動資訊
          </h1>
          <Breadcrumb />
        </div>
      </section>
      <Announcement sectionId="ActivityAnnouncement" items={ActivityAnnouncement.items} />
    </main>
  );
};

export default Page;
