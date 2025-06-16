export const revalidate = 60;

import Breadcrumb from "@/components/breadcrumb/breadcrumb";
import CourseTable from "@/components/course-table/course-table";

const Page: React.FC = () => {
  return (
    <main>
      <section>
        <div className="container py-8 md:py-16 pb-4 md:pb-8">
          <h1 className="font-semibold text-3xl md:text-4xl text-center">
            師培/專業課程
          </h1>
          <Breadcrumb />
        </div>
      </section>
      <CourseTable />
    </main>
  );
};

export default Page;
