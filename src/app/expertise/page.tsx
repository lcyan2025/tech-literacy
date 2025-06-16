export const revalidate = 60;

import { IconFileText } from "@tabler/icons-react";

import Breadcrumb from "@/components/breadcrumb/breadcrumb";
import CourseTable from "@/components/course-table/course-table";
import ExpertiseList from "@/components/expertise-list/expertise-list";
import Announcement from "@/components/announcement/announcement";

import { findRouteData } from "@/utils/notion";

const Page: React.FC = async () => {
  const data = await findRouteData("/expertise");
  const ExpertiseAnnouncement = data.Announcement.find(
    ({ name }: any) => name === "ExpertiseAnnouncement"
  );
  const ExpertiseDescription = data.Article.find(
    ({ name }: any) => name === "ExpertiseDescription"
  );
  const ExpertiseApplication = data.Article.find(
    ({ name }: any) => name === "ExpertiseApplication"
  );
  const ExpertiseRelatedRegulatoryDocuments = data.Article.find(
    ({ name }: any) => name === "ExpertiseRelatedRegulatoryDocuments"
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
      <Announcement
        title={ExpertiseAnnouncement.title}
        sectionId="ExpertiseAnnouncement"
        items={ExpertiseAnnouncement.items}
      />
      <section id="ExpertiseDescription">
        <div className="container py-8 md:py-16">
          <div className="flex flex-col gap-4 md:gap-8">
            <h2 className="font-semibold text-2xl md:text-3xl">專長加註辦法</h2>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-8">
              <div className="col-span-4 flex flex-col gap-4">
                <h3 className="font-semibold text-2xl text-denim-700" dangerouslySetInnerHTML={{ __html: ExpertiseDescription?.title || "" }} />
                <div dangerouslySetInnerHTML={{ __html: ExpertiseDescription?.description || "" }} />
              </div>
              <div className="col-span-3 flex flex-col gap-4 md:gap-8">
                <div className="flex flex-col gap-4">
                  <h3 className="font-semibold text-2xl text-denim-700">
                    <div className="flex items-center gap-1">
                      <IconFileText className="w-7 h-7" />
                      <div dangerouslySetInnerHTML={{ __html: ExpertiseApplication?.title || "" }} />
                    </div>
                  </h3>
                  <div dangerouslySetInnerHTML={{ __html: ExpertiseApplication?.description || "" }} />
                </div>
                <div className="flex flex-col gap-4">
                  <h3 className="font-semibold text-2xl text-denim-700" dangerouslySetInnerHTML={{ __html: ExpertiseRelatedRegulatoryDocuments?.title || "" }} />
                  <div dangerouslySetInnerHTML={{ __html: ExpertiseRelatedRegulatoryDocuments?.description || ""}} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <ExpertiseList />
      <CourseTable />
    </main>
  );
};

export default Page;
