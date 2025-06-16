export const revalidate = 60;

import Image from "next/image";

import Card from "@/components/card/card";
import Announcement from "@/components/announcement/announcement";
import Team from "@/components/team/team";

import { findRouteData } from "@/utils/notion";

const Page: React.FC = async () => {
  const data = await findRouteData("/");
  const HomeHero = data.Article.find(({ name }: any) => name === "HomeHero");
  const LatestAnnouncement = data.Announcement.find(
    ({ name }: any) => name === "LatestAnnouncement"
  );
  const HomeQuickCard = data.QuickLinkCard.find(
    ({ name }: any) => name === "HomeQuickCard"
  );
  const MeetTheTeam = data.MeetTheTeam.find(
    ({ name }: any) => name === "MeetTheTeam"
  );

  return (
    <main>
      <section>
        <div className="container py-8 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-9 gap-8 md:gap-16">
            <div className="col-span-1 md:col-span-5 flex flex-col justify-center items-center">
              <h1 className="font-semibold text-3xl md:text-4xl">
                {data.PageName}
              </h1>
            </div>
            <div id="HomeHero" className="col-span-1 md:col-span-4 flex flex-col justify-center items-center">
              <Image
                src={HomeHero.image[0]?.url}
                alt={HomeHero.image[0]?.name}
                width={1080}
                height={1080}
                className="w-full h-full max-h-60 aspect-square object-contain object-center m-auto"
                priority={true}
              />
            </div>
            <div className="col-span-1 md:col-span-9 flex flex-col justify-center items-center">
              <div dangerouslySetInnerHTML={{ __html: HomeHero?.description || "" || "" }} />
            </div>
            <div id="HomeQuickCard" className="col-span-1 md:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              {HomeQuickCard.items.map((card: any, index: any) => (
                <Card
                  key={index}
                  title={card.title}
                  link={card.link}
                  image={card.image || { name: "", url: "" }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      <Announcement
        title={LatestAnnouncement.title}
        sectionId="LatestAnnouncement"
        items={LatestAnnouncement.items}
      />
      <Team title={MeetTheTeam.title} items={MeetTheTeam.items} />
    </main>
  );
};

export default Page;
