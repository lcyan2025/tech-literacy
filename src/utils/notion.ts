import { Client } from "@notionhq/client";
import pLimit from "p-limit";

// Notion 客戶端初始化
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// 設置並發請求數量限制
const limit = pLimit(50);

// 提取 Notion 內容的工具函數
const extractContent = (contentArray: any[], key: string): string | undefined => {
  return (
    contentArray
      ?.map((item: any) => {
        const content = item?.[key]?.content || "";
        const link = item?.href;
        return link ? `<a class="underline hover:text-denim-500" href="${link}" target="_blank">${content}</a>` : content;
      })
      .join("") || undefined
  );
};

// 獲取頁面細節
const getPageDetails = async (id: string, type: string): Promise<any> => {
  try {
    const response = (await notion.pages.retrieve({ page_id: id })) as any;
    const data = response.properties;

    const result = await (async () => {
      switch (type) {
        case "Article":
          return {
            ID: data.ID?.unique_id?.number || 0,
            name: extractContent(data.Name?.title, "text") || "",
            title: extractContent(data.Title?.rich_text, "text") || "",
            description:
              extractContent(data.Description?.rich_text, "text") || "",
            image:
              data.Image?.files.map((file: any) => ({
                name: file.name || "",
                url: file.file.url || "",
              })) || [],
          };
        case "Announcement":
        case "IntroCard":
        case "MeetTheTeam":
        case "MindMap":
        case "QuickLinkCard":
        case "Timeline":
          return {
            ID: data.ID?.unique_id?.number || 0,
            name: extractContent(data.Name?.title, "text") || "",
            title: extractContent(data.Title?.rich_text, "text") || "",
            image:
              data.Image?.files.map((file: any) => ({
                name: file.name || "",
                url: file.file.url || "",
              })) || [],
            items: (await extractRelationIds(data.Items, `${type}Item`)) || [],
          };
        case "AnnouncementItem":
        case "IntroCardItem":
        case "MeetTheTeamItem":
        case "MindMapItem":
        case "QuickLinkCardItem":
        case "TimelineItem":
          return {
            ID: data.ID?.unique_id?.number || 0,
            title: extractContent(data.Title?.title, "text") || "",
            description:
              extractContent(data.Description?.rich_text, "text") || "",
            link:
              extractContent(data.Link?.rich_text, "text") ||
              data.Link?.formula?.string ||
              "",
            image: {
              name: data.Image?.files[0]?.name || "",
              url: data.Image?.files[0]?.file.url || "",
            },
            items:
              (await extractRelationIds(data["Sub-item"], `${type}`)) || [],
            bgClass:
              extractContent(data.BgClass?.rich_text, "text") || undefined,
            shadowClass:
              extractContent(data.ShadowClass?.rich_text, "text") || undefined,
            position:
              extractContent(data.Position?.rich_text, "text") || undefined,
          };
        default:
          return data;
      }
    })();

    return result;
  } catch (error) {
    console.error(`Error fetching page details for ${id}:`, error);
    return null;
  }
};

// 提取關聯 ID
const extractRelationIds = async (
  prop?: { relation: { id: string }[] },
  type?: string
): Promise<any[] | undefined> => {
  if (!prop || !prop.relation.length) return undefined;

  const promises = prop.relation.map((rel) =>
    limit(() => getPageDetails(rel.id, type || ""))
  );

  const results = await Promise.all(promises);

  const sortedResults = results.sort((a: any, b: any) => {
    return a.ID - b.ID;
  });

  return sortedResults;
};

// 查找路由數據
const findRouteData = async (routePath: string): Promise<any | null> => {
  try {
    const response = (await notion.databases.query({
      database_id: process.env.NOTION_ROUTE_DATABASE_ID || "",
    })) as any;

    const data = response.results.find((result: any) =>
      result.properties.Route?.title.some(
        (title: any) => title.text.content === routePath
      )
    );

    if (!data) return null;

    const result = {
      Route: routePath,
      PageName:
        extractContent(data.properties.PageName?.rich_text, "text") || "",
      Article: await extractRelationIds(data.properties.Article, "Article"),
      Announcement: await extractRelationIds(
        data.properties.Announcement,
        "Announcement"
      ),
      IntroCard: await extractRelationIds(
        data.properties.IntroCard,
        "IntroCard"
      ),
      MeetTheTeam: await extractRelationIds(
        data.properties.MeetTheTeam,
        "MeetTheTeam"
      ),
      MindMap: await extractRelationIds(data.properties.MindMap, "MindMap"),
      QuickLinkCard: await extractRelationIds(
        data.properties.QuickLinkCard,
        "QuickLinkCard"
      ),
      Timeline: await extractRelationIds(data.properties.Timeline, "Timeline"),
    };

    return result;
  } catch (error) {
    console.error("Error fetching route data:", error);
    return null;
  }
};

// 查找課程數據
const findCourseData = async (courseId?: string): Promise<any | null> => {
  try {
    const response = (await notion.databases.query({
      database_id: process.env.NOTION_COURSE_DATABASE_ID || "",
      sorts: [{ property: "ID", direction: "ascending" }],
    })) as any;

    const data = response.results.map((result: any) => ({
      Name: extractContent(result.properties.Name?.title, "text") || "",
      Title: extractContent(result.properties.Title?.rich_text, "text") || "",
      Credits: result.properties.Credits?.number || "",
      Type: result.properties.Type?.select?.name || "",
      Year: result.properties.Year?.select?.name || "",
      Category: result.properties.Category?.select?.name || "",
      Notes: extractContent(result.properties.Notes?.rich_text, "text") || "",
      MainImage: {
        name: result.properties.MainImage?.files[0]?.name || "",
        url: result.properties.MainImage?.files[0]?.file.url || "",
      },
      Goals: extractContent(result.properties.Goals?.rich_text, "text") || "",
      Outline: extractContent(result.properties.Outline?.rich_text, "text") || "",
      Assessment: extractContent(result.properties.Assessment?.rich_text, "text") || "",
      Schedule: extractContent(result.properties.Schedule?.rich_text, "text") || "",
      References: extractContent(result.properties.References?.rich_text, "text") || "",
      Highlights: result.properties.Highlights?.files.map((file: any) => ({
        name: file.name || "",
        url: file.file.url || "",
      })),
    }));

    const courseIdTransformed = courseId?.replace(/\s|-/g, "").toLowerCase() || "";
    const result =
      data.find(
        (course: any) =>
          course.Title.replace(/\s|-/g, "").toLowerCase() === courseIdTransformed
      ) || data;

    return result;
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
};

// 查找國小教師加註科技領域專長通過名單
const findExpertiseData = async (): Promise<any | null> => {
  try {
    const response = (await notion.databases.query({
      database_id: process.env.NOTION_EXPERTISE_DATABASE_ID || "",
      sorts: [{ property: "ID", direction: "ascending" }],
    })) as any;

    const data = response.results.map((result: any) => ({
      ID: extractContent(result.properties.Number?.title, "text") || "",
      Name: extractContent(result.properties.Name?.rich_text, "text") || result.properties.Name?.formula?.string || "",
    }));

    return data;
  } catch (error) {
    console.error("Error fetching expertise data:", error);
    return [];
  }
};

// 查找活動數據
const findActivityData = async (activityId: string): Promise<any | null> => {
  try {
    const response = (await notion.databases.query({
      database_id: process.env.NOTION_ACTIVITY_DATABASE_ID || "",
      filter: {
        and: [
          {
            property: "ID",
            number: {
              equals: parseInt(activityId),
            },
          },
          {
            property: "isVisible",
            checkbox: {
              equals: true,
            },
          },
        ],
      },
      sorts: [{ property: "ID", direction: "ascending" }],
    })) as any;

    const data = response.results[0];
    if (!data) return null;
    const result = {
      title: extractContent(data.properties.Title?.title, "text") || "",
      description:
        extractContent(data.properties.Description?.rich_text, "text") || "",
      type: data.properties.Type?.select?.name || "",
      image:
        data.properties.Image?.files.map((file: any) => ({
          name: file.name || "",
          url: file.file.url || "",
        })) || [],
    };
    return result;
  } catch (error) {
    console.error("Error fetching activity data:", error);
    return null;
  }
};

// 查找所有活動數據
const findAllActivityData = async (activityType?: string): Promise<any | null> => {
  try {
    const response = (await notion.databases.query({
      database_id: process.env.NOTION_ACTIVITY_DATABASE_ID || "",
      filter: {
        property: "isVisible",
        checkbox: {
          equals: true,
        },
      },
      sorts: [{ property: "ID", direction: "descending" }],
    })) as any;

    const result = response.results
      .map((result: any) => ({
        title: extractContent(result.properties.Title?.title, "text") || "",
        description:
          extractContent(result.properties.Description?.rich_text, "text") || "",
        link:
          extractContent(result.properties.Link?.rich_text, "text") ||
          result.properties.Link?.formula?.string ||
          "",
        type: result.properties.Type?.select?.name || "",
        image:
          result.properties.Image?.files.map((file: any) => ({
            name: file.name || "",
            url: file.file.url || "",
          })) || [],
      }))
      .filter((partner: any) => !activityType || partner.type === activityType);

    return result;
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
};

// 發送評論數據
const findAllCommentData = async (routePath?: string): Promise<any | null> => {
  try {
    const response = (await notion.databases.query({
      database_id: process.env.NOTION_COMMENT_DATABASE_ID || "",
    })) as any;

    const data = response.results.map((result: any) => ({
      name: extractContent(result.properties.Name?.title, "text") || "",
      email: extractContent(result.properties.Email?.rich_text, "text") || "",
      comment: extractContent(result.properties.Comment?.rich_text, "text") || "",
    }));

    const filteredData = routePath
      ? data.filter(
          (comment: any) =>
            comment.routePath?.toLowerCase() === routePath.toLowerCase()
        )
      : data;

    return filteredData;
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
};

const submitComment = async (formData: any): Promise<boolean> => {
  try {
    const response = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_COMMENT_DATABASE_ID || "",
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: "Contact Form",
              },
            },
          ],
        },
        Email: {
          email: formData.email || null,
        },
        Message: {
          rich_text: [
            {
              text: {
                content: formData.message || "",
              },
            },
          ],
        },
        Status: {
          status: {
            name: "Not started",
          },
        },
      },
    });

    if (response) {
      console.log("Form submitted successfully");
      return true;
    } else {
      console.error("Failed to submit form");
      return false;
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    return false;
  }
};

export {
  findRouteData,
  findCourseData,
  findExpertiseData,
  findActivityData,
  findAllActivityData,
  findAllCommentData,
  submitComment,
};
