import Image from "next/image";

interface IntroCardProps {
  title: string;
  description: string;
  image: {
    url: string;
    name: string;
  };
}
const IntroCard: React.FC<IntroCardProps> = ({ title, description, image }) => {
  return (
    <div className="p-4 md:p-6 group">
      <div className="flex flex-col justify-center items-center gap-4">
        <Image
          src={image.url}
          alt={image.name}
          width={400}
          height={400}
          className="w-60 max-w-full aspect-square object-contain object-center group-hover:scale-110 py-4"
          priority={true}
        />
        <h4 className="font-semibold text-xl" dangerouslySetInnerHTML={{ __html: title || "" }} />
        <div dangerouslySetInnerHTML={{ __html: description || "" }} />
      </div>
    </div>
  );
};

export default IntroCard;
