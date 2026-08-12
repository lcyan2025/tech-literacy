import {
  getActivities,
  getCourses,
  getExpertise,
  getRouteContent,
  submitComment as insertComment,
} from "@/lib/content/queries";

export const findRouteData = getRouteContent;

export async function findCourseData(courseId?: string) {
  const records = await getCourses(courseId);
  return courseId ? records[0] || null : records;
}

export const findExpertiseData = getExpertise;
export const findAllActivityData = getActivities;

export async function findActivityData(activityId: string) {
  const records = await getActivities();
  return (
    records.find(
      (record) =>
        record.id === activityId ||
        record.legacyId === activityId ||
        record.title === activityId ||
        record.link === activityId,
    ) || null
  );
}

export async function findAllCommentData() {
  return [];
}

export async function submitComment(formData: {
  routePath?: string;
  name?: string;
  email?: string;
  message?: string;
  comment?: string;
}) {
  await insertComment({
    routePath: formData.routePath,
    name: formData.name || "訪客",
    email: formData.email,
    message: formData.message || formData.comment || "",
  });
  return true;
}
