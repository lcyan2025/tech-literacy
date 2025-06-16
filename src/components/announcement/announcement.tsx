import Link from "next/link";
import Image from "next/image";
import { IconChevronRight, IconSpeakerphone } from "@tabler/icons-react";

interface AnnouncementItemProps {
  title: string;
  description: string;
  link: string;
}
const AnnouncementItem: React.FC<AnnouncementItemProps> = ({
  title,
  description,
  link,
}) => {
  return (
    <Link
      href={link}
      className="col-span-1 md:col-span-2 block bg-denim-50/75 hover:bg-denim-50/90 text-denim-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl group"
    >
      <div className="flex justify-between items-center h-full gap-4 p-6">
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-xl" dangerouslySetInnerHTML={{ __html: title || "" }} />
          {description.length > 0 && <div className="line-clamp-3" dangerouslySetInnerHTML={{ __html: description || "" }} />}
        </div>
        <IconChevronRight className="shrink-0 size-10 translate-x-0 group-hover:translate-x-2 transition-all duration-500" />
      </div>
    </Link>
  );
};
interface AnnouncementProps {
  title?: string;
  sectionId: string;
  items: AnnouncementItemProps[];
}
const Announcement: React.FC<AnnouncementProps> = ({ title, sectionId, items }) => {
  return (
    <section id={sectionId} className="bg-denim-800">
      <div className="container py-8 md:py-16">
        <div className="flex flex-col gap-4 md:gap-8">
          {title && (
            <h2 className="font-semibold text-2xl md:text-3xl text-gray-50">
              <div className="flex items-center gap-1.5">
                <IconSpeakerphone className="size-8 -rotate-12" />
                <div dangerouslySetInnerHTML={{ __html: title || "" }} />
              </div>
            </h2>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
            <div className="col-span-1 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 [&>*:nth-child(-n+2)]:lg:col-span-1 gap-3 lg:gap-6">
              {items.reverse().map((announcement, index) => (
                <AnnouncementItem
                  key={index}
                  title={announcement.title}
                  description={announcement.description}
                  link={announcement.link}
                />
              ))}
            </div>
            <div className="col-span-1">
              <Image
                src="/images/notify.png"
                alt="notify"
                width={1080}
                height={1080}
                className="w-full h-full max-h-48 lg:max-h-64 object-contain object-right-top p-4 ml-auto"
                priority={true}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Announcement;
