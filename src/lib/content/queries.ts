import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ActivityRecord,
  ContentItem,
  ContentSection,
  CourseRecord,
  ExpertiseRecord,
  MediaRef,
  RouteContent,
} from "@/lib/content/types";

const sectionTypes = [
  "Article",
  "Announcement",
  "IntroCard",
  "MeetTheTeam",
  "MindMap",
  "QuickLinkCard",
  "Timeline",
] as const;

type SectionType = (typeof sectionTypes)[number];

type ItemRow = {
  id: string;
  section_id: string;
  parent_id: string | null;
  name: string;
  title: string;
  description: string;
  link: string;
  date: string | null;
  image_url: string | null;
  image_name: string | null;
  legacy_id: string | null;
  bg_class: string | null;
  shadow_class: string | null;
  position: string | null;
};

type SectionRow = {
  id: string;
  section_type: SectionType;
  name: string;
  title: string;
  description: string;
  image_url: string | null;
  image_name: string | null;
  legacy_id: string | null;
};

function mediaRef(url: string | null, name: string | null): MediaRef | null {
  return url ? { url, name: name || "" } : null;
}

function mapItem(row: ItemRow, children: ContentItem[]): ContentItem {
  return {
    id: row.id,
    ID: row.legacy_id || undefined,
    name: row.name,
    title: row.title,
    description: row.description,
    link: row.link,
    image: mediaRef(row.image_url, row.image_name) || { name: "", url: "" },
    date: row.date || undefined,
    bgClass: row.bg_class || "",
    shadowClass: row.shadow_class || "",
    position: row.position || "",
    items: children,
  };
}

function childItems(rows: ItemRow[], parentId: string | null): ContentItem[] {
  return rows
    .filter((row) => row.parent_id === parentId)
    .map((row) => mapItem(row, childItems(rows, row.id)));
}

function sectionItem(section: SectionRow, items: ItemRow[]): ContentSection {
  const rootImage = mediaRef(section.image_url, section.image_name);

  return {
    id: section.id,
    ID: section.legacy_id || undefined,
    name: section.name,
    title: section.title,
    description: section.description,
    image: rootImage ? [rootImage] : [],
    items: childItems(items, null),
  };
}

function emptyRouteContent(routePath: string): RouteContent {
  return {
    Route: routePath,
    PageName: "",
    Article: [],
    Announcement: [],
    IntroCard: [],
    MeetTheTeam: [],
    MindMap: [],
    QuickLinkCard: [],
    Timeline: [],
  };
}

export async function getRouteContent(
  routePath: string,
): Promise<RouteContent | null> {
  const supabase = await createSupabaseServerClient();
  const { data: page, error: pageError } = await supabase
    .from("site_pages")
    .select("id, route_path, page_name")
    .eq("route_path", routePath)
    .eq("is_published", true)
    .maybeSingle();

  if (pageError) throw pageError;
  if (!page) return null;

  const { data: sections, error: sectionError } = await supabase
    .from("content_sections")
    .select(
      "id, section_type, name, title, description, image_url, image_name, legacy_id",
    )
    .eq("page_id", page.id)
    .eq("is_published", true)
    .in("section_type", sectionTypes)
    .order("sort_order", { ascending: true });

  if (sectionError) throw sectionError;

  const sectionRows = (sections || []) as SectionRow[];
  const sectionIds = sectionRows.map((section) => section.id);
  let itemRows: ItemRow[] = [];

  if (sectionIds.length > 0) {
    const { data: items, error: itemError } = await supabase
      .from("content_items")
      .select(
        "id, section_id, parent_id, name, title, description, link, date, image_url, image_name, legacy_id, bg_class, shadow_class, position",
      )
      .in("section_id", sectionIds)
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (itemError) throw itemError;
    itemRows = (items || []) as ItemRow[];
  }

  const result = emptyRouteContent(routePath);
  result.PageName = page.page_name || "";

  for (const section of sectionRows) {
    const sectionItems = itemRows.filter(
      (item) => item.section_id === section.id,
    );
    result[section.section_type].push(sectionItem(section, sectionItems));
  }

  return result;
}

export async function getCourses(courseId?: string): Promise<CourseRecord[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const records = ((data || []) as Array<Record<string, unknown>>).map(
    (row): CourseRecord => ({
      id: String(row.id),
      Name: String(row.name || ""),
      Title: String(row.title || ""),
      Credits: Number(row.credits || 0),
      Type: String(row.course_type || ""),
      Year: String(row.year || ""),
      Category: String(row.category || ""),
      Notes: String(row.notes || ""),
      MainImage: mediaRef(
        (row.main_image_url as string | null) || null,
        (row.main_image_name as string | null) || null,
      ) || { name: "", url: "" },
      Goals: String(row.goals || ""),
      Outline: String(row.outline || ""),
      Assessment: String(row.assessment || ""),
      Schedule: String(row.schedule || ""),
      References: String(row.references_text || ""),
      Highlights: Array.isArray(row.highlights)
        ? (row.highlights as MediaRef[])
        : [],
    }),
  );

  if (!courseId) return records;

  const normalizedId = courseId.replace(/\s|-/g, "").toLowerCase();
  const match = records.find(
    (course) => course.Title.replace(/\s|-/g, "").toLowerCase() === normalizedId,
  );

  return match ? [match] : records;
}

export async function getExpertise(): Promise<ExpertiseRecord[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("expertise_records")
    .select("id, legacy_id, name, category")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return ((data || []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    ID: String(row.legacy_id || ""),
    Name: String(row.name || ""),
    Category: String(row.category || ""),
  }));
}

export async function getActivities(
  activityType?: string,
): Promise<ActivityRecord[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("activities")
    .select(
      "id, legacy_id, title, description, activity_type, link, image_url, image_name, images",
    )
    .eq("is_published", true)
    .order("sort_order", { ascending: false });

  if (activityType) query = query.eq("activity_type", activityType);

  const { data, error } = await query;
  if (error) throw error;

  return ((data || []) as Array<Record<string, unknown>>).map((row) => {
    const fallbackImage = mediaRef(
      (row.image_url as string | null) || null,
      (row.image_name as string | null) || null,
    );
    const images = Array.isArray(row.images)
      ? (row.images as MediaRef[]).filter((image) => image?.url)
      : [];

    return {
      id: String(row.id),
      legacyId: row.legacy_id ? String(row.legacy_id) : undefined,
      title: String(row.title || ""),
      description: String(row.description || ""),
      link: String(row.link || ""),
      type: String(row.activity_type || ""),
      image: images.length > 0 ? images : fallbackImage ? [fallbackImage] : [],
    };
  });
}

export async function submitComment(input: {
  routePath?: string;
  name: string;
  email?: string;
  message: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("comments").insert({
    route_path: input.routePath || "",
    name: input.name,
    email: input.email || null,
    message: input.message,
    status: "pending",
  });

  if (error) throw error;
}
