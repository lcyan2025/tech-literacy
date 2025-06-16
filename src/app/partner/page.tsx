export const revalidate = 60;

import Breadcrumb from "@/components/breadcrumb/breadcrumb";
import Card from "@/components/card/card";

import { findRouteData } from "@/utils/notion";

const Page: React.FC = async () => {
  const data = await findRouteData("/partner");
  const PartnerQuickCard = data.QuickLinkCard.find(
    ({ name }: any) => name === "PartnerQuickCard"
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
      <section id="PartnerQuickCard" className="bg-gray-200/55">
        <div className="container py-8 md:py-16">
          <div className="col-span-1 md:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {PartnerQuickCard.items.map((item: any, index: any) => (
              <Card
                key={index}
                title={item.title}
                link={item.link}
                image={item.image || { name: "", url: "" }}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;
