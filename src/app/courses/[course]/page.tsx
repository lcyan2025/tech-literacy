export const revalidate = 60;

import Image from "next/image";
import { notFound } from "next/navigation";
import { findCourseData } from "@/utils/notion";

import Breadcrumb from "@/components/breadcrumb/breadcrumb";
import TabContainer from "@/components/tab-container/tab-container";
import ExpandableImage from "@/components/expandable-image/expandable-image";

const InfoSection: React.FC<any> = ({ title, content }) => {
  if (!content) return null;

  return (
    <div className="flex flex-col gap-2">
      <h5 className="font-medium" dangerouslySetInnerHTML={{ __html: title || "" }} />
      {typeof content === "string" ? (
        <div dangerouslySetInnerHTML={{ __html: content || "" }} />
      ) : (
        content
      )}
    </div>
  );
};

const Page: React.FC = async ({ params }: any) => {
  const data = await findCourseData(params.course);
  if (!data) {
    return notFound();
  }

  const courseData = {
    Name: data.Name,
    MainImage: data.MainImage,
    教學目標: data.Goals,
    課程大綱: data.Outline,
    評量方式: data.Assessment,
    參考資料: data.References,
    課程說明: `科目名稱：${data.Name}<br/>
    科目英文名稱：${data.Title}<br/>
    開課年級：${data.Year}<br/>
    學分數：${data.Credits}<br/>
    必(選)修別：${data.Type}`,
    本學期開課資訊: data.Schedule || "暫無資訊",
    課堂花絮:
      data.Highlights?.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {data.Highlights.map((highlight: any, index: number) => (
            <ExpandableImage
              key={index}
              src={highlight.url}
              alt={highlight.name}
              className="aspect-square object-cover object-center"
            />
          ))}
        </div>
      ) : (
        "暫無花絮照片"
      ),
  };

  return (
    <main>
      <section>
        <div className="container py-8 md:py-16 pb-4 md:pb-8">
          <h1 className="font-semibold text-3xl md:text-4xl text-center">
            {courseData.Name}
          </h1>
          <Breadcrumb givenNames={[{ key: 1, value: courseData.Name }]} />
        </div>
      </section>
      <section>
        <div className="container py-8 md:py-16 pt-4 md:pt-4">
          <div className="grid grid-cols-1 md:grid-cols-6 md:divide-x-2">
            <div className="col-span-4 md:pr-6 lg:pr-8">
              <Image
                src={courseData.MainImage.url}
                alt={courseData.MainImage.name}
                width={1800}
                height={1800}
                className="w-full aspect-[2/1] bg-gray-400 rounded-md object-cover object-center"
                priority={true}
              />
              <div className="md:hidden col-span-2 md:pl-6 lg:pl-8">
                <div className="flex flex-col gap-4 divide-y *:pt-4">
                  <InfoSection
                    title="本學期開課資訊"
                    content={courseData["本學期開課資訊"]}
                  />
                  <InfoSection
                    title="課程說明"
                    content={courseData["課程說明"]}
                  />
                  <InfoSection
                    title="課堂花絮"
                    content={courseData["課堂花絮"]}
                  />
                </div>
              </div>
              <TabContainer
                data={courseData}
                limit={["教學目標", "課程大綱", "評量方式", "參考資料"]}
              />
            </div>
            <div className="hidden md:block col-span-2 md:pl-6 lg:pl-8">
              <div className="flex flex-col gap-4 divide-y *:pt-4">
                <InfoSection
                  title="本學期開課資訊"
                  content={courseData["本學期開課資訊"]}
                />
                <InfoSection
                  title="課程說明"
                  content={courseData["課程說明"]}
                />
                <InfoSection
                  title="課堂花絮"
                  content={courseData["課堂花絮"]}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;
