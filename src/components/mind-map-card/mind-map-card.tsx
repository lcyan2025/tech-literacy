import Link from "next/link";
import { IconHandClick } from "@tabler/icons-react";

interface MindMapNode {
  title: string;
  link?: string;
  items?: MindMapNode[];
}
interface RecursiveMindMapNodeProps {
  node: MindMapNode;
  depth: number;
}
const RecursiveMindMapNode: React.FC<RecursiveMindMapNodeProps> = ({
  node,
  depth,
}) => {
  if (depth > 10) {
    return null;
  }
  return (
    <li className="children-item">
      {node.link ? (
        <Link href={node.link} className="btn flex items-center gap-1">
          <div dangerouslySetInnerHTML={{ __html: node.title || "" }} />
          <IconHandClick className="size-5 stroke-1.5 fill-white shrink-0" />
        </Link>
      ) : (
        <div className="btn shrink-0">
          <div dangerouslySetInnerHTML={{ __html: node.title || "" }} />
        </div>
      )}
      {node.items && node.items.length > 0 && (
        <ol className="children">
          {node.items.map((subnode, idx) => (
            <RecursiveMindMapNode key={idx} node={subnode} depth={depth + 1} />
          ))}
        </ol>
      )}
    </li>
  );
};
interface MindMapCardProps {
  title: string;
  link?: string;
  items: MindMapNode[];
  bgClass: string;
  shadowClass: string;
}
const MindMapCard: React.FC<MindMapCardProps> = ({
  title,
  link,
  items,
  bgClass,
  shadowClass,
}) => (
  <div
    className={`mind-map w-fit text-sm md:text-base p-0 m-auto ${bgClass} ${shadowClass}`}
  >
    {link ? (
      <Link href={link} className="bt flex items-center gap-1">
        <div dangerouslySetInnerHTML={{ __html: title || "" }} />
        <IconHandClick className="size-5 stroke-1.5 fill-white shrink-0" />
      </Link>
    ) : (
      <div className="btn shrink-0">
        <div dangerouslySetInnerHTML={{ __html: title || "" }} />
      </div>
    )}
    <ol className="children">
      {items.map((node, index) => (
        <RecursiveMindMapNode key={index} node={node} depth={0} />
      ))}
    </ol>
  </div>
);

export default MindMapCard;
