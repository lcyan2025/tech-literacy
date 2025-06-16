"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";

import { GetNameByRoute } from "@/utils/route";

const Breadcrumb: React.FC<{
  givenNames?: {
    key: number;
    value: string;
  }[];
}> = ({ givenNames }) => {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter((segment) => segment);

  const getBreadcrumbName = (segment: string) => {
    return GetNameByRoute(segment);
  };

  return (
    <nav className="flex mt-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center flex-wrap space-x-1 md:space-x-2 rtl:space-x-reverse">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-denim-600"
          >
            {GetNameByRoute("home")}
          </Link>
        </li>
        {pathSegments.map((segment, index) => {
          const givenName = givenNames?.find(
            (item) => item.key === index
          )?.value;
          const href = "/" + pathSegments.slice(0, index + 1).join("/");
          return (
            <li key={index}>
              <div className="flex items-center">
                <IconChevronRight className="size-5 text-gray-600" />
                {index < pathSegments.length - 1 ? (
                  <Link
                    href={href}
                    className="ms-1 text-sm font-medium text-gray-600 hover:text-denim-600 md:ms-2 line-clamp-1"
                    dangerouslySetInnerHTML={{ __html: getBreadcrumbName(segment) || givenName || decodeURIComponent(segment) }}
                  />
                ) : (
                  <div className="ms-1 text-sm font-medium text-gray-400 md:ms-2 line-clamp-1"
                    dangerouslySetInnerHTML={{ __html: getBreadcrumbName(segment) || givenName || decodeURIComponent(segment) }}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
