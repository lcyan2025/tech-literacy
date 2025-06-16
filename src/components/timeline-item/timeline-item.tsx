interface TimelineItemProps {
  title: string;
  duration: string;
  description: string;
}
const TimelineItem: React.FC<TimelineItemProps> = ({
  title,
  duration,
  description,
}) => (
  <div className="timeline-item">
    <h4 className="title" dangerouslySetInnerHTML={{ __html: title || "" }} />
    <h5 className="time" dangerouslySetInnerHTML={{ __html: duration || "" }} />
    <div dangerouslySetInnerHTML={{ __html: description || "" }} />
  </div>
);

export default TimelineItem;
