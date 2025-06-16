export const revalidate = 60;

import { notFound } from "next/navigation";
import { findActivityData } from "@/utils/notion";

import Breadcrumb from "@/components/breadcrumb/breadcrumb";
import ExpandableImage from "@/components/expandable-image/expandable-image";

const Page: React.FC = async ({ params }: any) => {
  const routeType = decodeURIComponent(params.type);
  const routeName = decodeURIComponent(params.id);
  console.log(routeType, routeName);

  const data: {
    title: string;
    description: string;
    image: {
      name: string;
      url: string;
    }[];
  } = await findActivityData(routeName);

  if (!data) {
    return notFound();
  }

  return (
    <main>
      <section>
        <div className="container py-8 md:py-16 pb-4 md:pb-8">
          <h1 className="font-semibold text-3xl md:text-4xl text-center" dangerouslySetInnerHTML={{ __html: data?.title || "" }} />
          <Breadcrumb givenNames={[{ key: 1, value: routeType }, { key: 2, value: data.title }]}  />
        </div>
      </section>
      <section>
        <div className="container py-8 md:py-16 pt-4 md:pt-4">
          <div className="grid grid-cols-1 gap-6 md:gap-10 divide-y-2 [&>:nth-child(n+2)]:pt-6 [&>:nth-child(n+2)]:md:pt-10">
          <div id={`${data.title}`} className="col-span-1 flex flex-col gap-4">
            <h3 className="font-semibold text-xl md:text-2xl" dangerouslySetInnerHTML={{ __html: data?.title || "" }} />
            {data.description.length > 0 && <div dangerouslySetInnerHTML={{ __html: data.description || "" }} />}
            <div className="grid grid-cols-3 md:grid-cols-8 gap-3">
              {data.image.map((image: any, index: any) => (
                <ExpandableImage
                  key={index}
                  src={image.url}
                  alt={image.name}
                  className="aspect-square object-cover object-center"
                />
              ))}
            </div>
          </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;
