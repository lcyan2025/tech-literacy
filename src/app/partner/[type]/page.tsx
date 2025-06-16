export const revalidate = 60;

import Image from "next/image";
import { findAllActivityData } from "@/utils/notion";

import Breadcrumb from "@/components/breadcrumb/breadcrumb";
import Link from "next/link";

const Page: React.FC = async ({ params }: any) => {
  const routeName = decodeURIComponent(params.type);

  const data: {
    title: string;
    description: string;
    link: string;
    image: {
      name: string;
      url: string;
    }[];
  }[] = await findAllActivityData(routeName);

  return (
    <main>
      <section>
        <div className="container py-8 md:py-16 pb-4 md:pb-8">
          <h1 className="font-semibold text-3xl md:text-4xl text-center">
            {routeName}
          </h1>
          <Breadcrumb givenNames={[{ key: 1, value: routeName }]}  />
        </div>
      </section>
      <section>
        <div className="container py-8 md:py-16 pt-4 md:pt-4">
          <div className="grid grid-cols-1 gap-6 md:gap-10 divide-y-2 [&>:nth-child(n+2)]:pt-6 [&>:nth-child(n+2)]:md:pt-10">
            {data.length > 0 ? (
              data.map((item: any, index: any) => (
                <div key={index} className="col-span-1 flex flex-col gap-4">
                  <h3 className="font-semibold text-xl md:text-2xl" dangerouslySetInnerHTML={{ __html: item?.title || "" }} />
                  {item?.description.length > 0 && <div className="line-clamp-3" dangerouslySetInnerHTML={{ __html: item?.description || "" }} />}
                  <div className="grid grid-cols-3 md:grid-cols-8 gap-3">
                    {
                      item.image.slice(0, 5).map((image: any, index: any) => (
                        <Image
                          key={index}
                          src={image.url}
                          alt={image.name}
                          width={250}
                          height={250}
                          className={`aspect-square object-cover object-center ${parseInt(index) > 2 ? "hidden md:block" : ""}`}
                          priority={true}
                        />
                      ))
                    }
                  </div>
                  <Link href={`${item.link}`} className="btn flex items-center gap-1 bg-denim-400 shadow-denim-600 w-fit ml-auto">活動詳情</Link>
                </div>
              ))
            ) : (
              <div className="col-span-1 text-center text-gray-500">
                暫無資料
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;
