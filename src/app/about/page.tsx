export const revalidate = 60;

import Image from "next/image";

import Breadcrumb from "@/components/breadcrumb/breadcrumb";
import IntroCard from "@/components/intro-card/intro-card";
import MindMapCard from "@/components/mind-map-card/mind-map-card";
import TimelineItem from "@/components/timeline-item/timeline-item";

import { findRouteData } from "@/utils/notion";

const Page: React.FC = async () => {
  const data = await findRouteData("/about");
  const ProjectOverview = data.IntroCard.find(
    ({ name }: any) => name === "ProjectOverview"
  );
  const ProjectPurpose = data.Article.find(
    ({ name }: any) => name === "ProjectPurpose"
  );
  const ProjectStructure = data.MindMap.find(
    ({ name }: any) => name === "ProjectStructure"
  );
  const ProjectTimeline = data.Timeline.find(
    ({ name }: any) => name === "ProjectTimeline"
  );

  return (
    <main>
      <section>
        <div className="container py-8 md:py-16 pb-4 md:pb-8">
          <h1 className="font-semibold text-3xl md:text-4xl text-center">
            {data.PageName}
          </h1>
          <Breadcrumb />
        </div>
      </section>
      <section id="ProjectOverview" className="bg-gray-200/55">
        <div className="container py-8 md:py-16">
          <div className="flex flex-col gap-4 md:gap-8">
            <h2 className="font-semibold text-2xl md:text-3xl text-center" dangerouslySetInnerHTML={{ __html: ProjectOverview?.title || "" }} />
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {ProjectOverview.items.map((item: any, index: any) => (
                  <IntroCard
                    key={index}
                    title={item.title}
                    description={item.description}
                    image={item.image}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="ProjectStructure">
        <div className="container py-8 md:py-16">
          <div className="flex flex-col gap-4 md:gap-8">
            <h2 className="font-semibold text-2xl md:text-3xl text-center" dangerouslySetInnerHTML={{ __html: ProjectStructure?.title || "" }} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-8 w-fit m-auto">
              {ProjectStructure.items.map((item: any, index: any) => (
                <MindMapCard {...item} key={index} />
              ))}
              <div id="ProjectPurpose" className="flex max-w-2xl">
                <article>
                  <h4 className="font-semibold text-lg mb-2" dangerouslySetInnerHTML={{ __html: ProjectPurpose?.title || "" }} />
                  <div dangerouslySetInnerHTML={{ __html: ProjectPurpose?.description || ""}} />
                </article>
                <Image
                  src={ProjectPurpose.image[0]?.url}
                  alt={ProjectPurpose.image[0]?.name}
                  width={400}
                  height={400}
                  className="hidden md:block w-60 max-w-full aspect-square object-contain object-center"
                  priority={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="ProjectTimeline" className="bg-denim-100/55">
        <div className="container py-8 md:py-16">
          <div className="flex flex-col gap-4 md:gap-8">
            <h2 className="font-semibold text-2xl md:text-3xl text-center" dangerouslySetInnerHTML={{ __html: ProjectTimeline?.title || "" }} />
            <div className="timeline grid grid-cols-1 md:grid-cols-2">
              {ProjectTimeline.items.map((item: any, index: any) => (
                <TimelineItem
                  key={index}
                  title={item.title}
                  duration={item.duration}
                  description={item.description}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;
