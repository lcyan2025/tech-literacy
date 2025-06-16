import { findCourseData } from "@/utils/notion";
import Link from "next/link";
import { IconHandClick } from "@tabler/icons-react";

interface Course {
  Name: string;
  Title: string;
  Category?: string;
  Credits: number;
  Type: string;
  Notes?: string;
}

const CourseTable: React.FC = async () => {
  const courses: Course[] = await findCourseData();

  const groupedCourses: { [key: string]: Course[] } = courses.reduce(
    (acc, course) => {
      const category = course.Category || "其他";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(course);
      return acc;
    },
    {} as { [key: string]: Course[] }
  );

  return (
    <section id="CourseTable">
      <div className="container py-8 md:py-16">
        <div className="flex flex-col gap-4 md:gap-8">
          <h2 className="font-semibold text-2xl md:text-3xl">課程架構</h2>
          <div className="w-full overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 whitespace-nowrap">
              <thead>
                <tr>
                  <th className="py-2 px-4 border font-semibold">類別名稱</th>
                  <th className="py-2 px-4 border font-semibold">開課學分數</th>
                  <th className="py-2 px-4 border font-semibold">科目名稱</th>
                  <th className="py-2 px-4 border font-semibold">學分數</th>
                  <th className="py-2 px-4 border font-semibold">必(選)修別</th>
                  <th className="py-2 px-4 border font-semibold">備註</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedCourses).map(([category, courses]) =>
                  courses.map((item, index) => (
                    <tr key={index}>
                      {index === 0 && (
                        <>
                          <td
                            rowSpan={courses.length}
                            className="py-2 px-4 border"
                          >
                            {category}
                          </td>
                          <td
                            rowSpan={courses.length}
                            className="py-2 px-4 border"
                          >
                            {courses.reduce(
                              (sum, course) => sum + course.Credits,
                              0
                            )}
                          </td>
                        </>
                      )}
                      <td className="py-2 px-4 border">
                        <Link
                          href={`/courses/${item.Title.replace(
                            /\s/g,
                            "-"
                          ).toLowerCase()}`}
                          className="flex items-center gap-1 group"
                        >
                          <div dangerouslySetInnerHTML={{ __html: item?.Name || "" }} className="underline group-hover:text-denim-500" />
                          <IconHandClick className="size-5 stroke-1.5 fill-white shrink-0" />
                        </Link>
                      </td>
                      <td className="py-2 px-4 border">{item.Credits}</td>
                      <td className="py-2 px-4 border">{item.Type}</td>
                      <td className="py-2 px-4 border">{item.Notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseTable;
