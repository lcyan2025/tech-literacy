import Image from "next/image";
import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";

interface CardProps {
  title: string;
  link: string;
  image: {
    url: string;
    name: string;
  };
}
const Card: React.FC<CardProps> = ({ title, image, link }) => {
  return (
    <Link
      href={link}
      className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl group bg-gray-50"
    >
      <div className="flex flex-col gap-4 p-6">
        <Image
          src={image.url}
          alt={image.name}
          width={500}
          height={500}
          className="w-full max-w-48 h-full aspect-square object-contain object-center m-auto"
          priority={true}
        />
        <h4 className="font-bold text-xl text-center" dangerouslySetInnerHTML={{ __html: title || "" }} />
      </div>
      <div className="absolute top-0 opacity-0 group-hover:opacity-100 backdrop-blur-lg backdrop-brightness-105 size-px group-hover:size-full transition-show group-hover:transition-hide rounded-2xl overflow-hidden">
        <div className="flex justify-center items-center gap-1 w-full h-full text-xl">
          了解更多
          <IconArrowRight className="size-[1.25em]" />
        </div>
      </div>
    </Link>
  );
};

export default Card;
