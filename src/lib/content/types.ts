export interface MediaRef {
  name: string;
  url: string;
}

export interface ContentItem {
  id: string;
  ID?: string | number;
  name?: string;
  title?: string;
  description?: string;
  link?: string;
  image?: MediaRef | MediaRef[] | null;
  date?: string;
  bgClass?: string;
  shadowClass?: string;
  position?: string;
  items?: ContentItem[];
}

export interface ContentSection extends ContentItem {
  items: ContentItem[];
}

export interface RouteContent {
  Route: string;
  PageName: string;
  Article: ContentSection[];
  Announcement: ContentSection[];
  IntroCard: ContentSection[];
  MeetTheTeam: ContentSection[];
  MindMap: ContentSection[];
  QuickLinkCard: ContentSection[];
  Timeline: ContentSection[];
}

export interface CourseRecord {
  id: string;
  Name: string;
  Title: string;
  Credits: string;
  Type: string;
  Year: string;
  Category: string;
  Notes: string;
  MainImage: MediaRef;
  Goals: string;
  Outline: string;
  Assessment: string;
  Schedule: string;
  References: string;
  Highlights: MediaRef[];
}

export interface ExpertiseRecord {
  id: string;
  ID: string;
  Name: string;
  Category: string;
}

export interface ActivityRecord {
  id: string;
  title: string;
  description: string;
  link: string;
  type: string;
  image: MediaRef[];
}
