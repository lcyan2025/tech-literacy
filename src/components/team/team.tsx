import Image from "next/image";
import Link from "next/link";

interface TeamItemProps {
  title: string;
  position: string;
  description: string;
  image: {
    url: string;
    name: string;
  };
  link: string;
}
const TeamItem: React.FC<TeamItemProps> = ({
  title,
  position,
  description,
  image,
  link,
}) => {
  return (
    <>
      {
        link ? (
          <Link href={`${link}`} target="_blank">
            <div className="relative size-full rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl group max-w-48 m-auto block">
              <Image
                src={image.url}
                alt={image.name}
                width={500}
                height={500}
                className="size-full aspect-square object-cover object-center bg-gray-400 m-auto"
                priority={true}
              />
              <div className="absolute top-0 opacity-0 group-hover:opacity-100 backdrop-blur-lg backdrop-brightness-105 size-px group-hover:size-full bg-denim-500/50 transition-show group-hover:transition-hide">
                <div className="flex flex-col justify-end gap-1 size-full p-4">
                  <h4 className="font-bold text-lg md:text-xl" dangerouslySetInnerHTML={{ __html: title || "" }} />
                  <div className="text-xs sm:text-sm" dangerouslySetInnerHTML={{ __html: position || "" }} />
                  <div className="text-xs sm:text-sm line-clamp-2 sm:line-clamp-none" dangerouslySetInnerHTML={{ __html: description || "" }} />
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <div className="relative size-full rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl group max-w-48 m-auto block">
            <Image
              src={image.url}
              alt={image.name}
              width={500}
              height={500}
              className="size-full aspect-square object-cover object-center bg-gray-400 m-auto"
              priority={true}
            />
            <div className="absolute top-0 opacity-0 group-hover:opacity-100 backdrop-blur-lg backdrop-brightness-105 size-px group-hover:size-full bg-denim-500/50 transition-show group-hover:transition-hide">
              <div className="flex flex-col justify-end gap-1 size-full p-4">
                <h4 className="font-bold text-lg md:text-xl" dangerouslySetInnerHTML={{ __html: title || "" }} />
                <div className="text-xs sm:text-sm" dangerouslySetInnerHTML={{ __html: position || "" }} />
                <div className="text-xs sm:text-sm line-clamp-2 sm:line-clamp-none" dangerouslySetInnerHTML={{ __html: description || "" }} />
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};

interface TeamProps {
  title: string;
  items: TeamItemProps[];
}
const Team: React.FC<TeamProps> = ({ title, items }) => {
  return (
    <section id="MeetTheTeam">
      <div className="container py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-9 gap-4 md:gap-8">
          <div className="col-span-1 md:col-span-9 flex flex-col justify-center items-center">
            <h2 className="font-semibold text-3xl md:text-4xl" dangerouslySetInnerHTML={{ __html: title || "" }} />
          </div>
          <div className="col-span-1 md:col-span-9 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-8">
            {items.map((item, index) => (
              <TeamItem
                key={index}
                {...item}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Team;
