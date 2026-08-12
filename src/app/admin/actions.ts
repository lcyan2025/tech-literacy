"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("role, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!profile) redirect("/admin/login?error=unauthorized");

  return supabase;
}

export async function createPage(formData: FormData) {
  const supabase = await requireAdmin();
  const routePath = String(formData.get("route_path") || "").trim();
  const pageName = String(formData.get("page_name") || "").trim();

  if (!routePath.startsWith("/")) {
    throw new Error("路徑必須以 / 開頭。");
  }

  const { error } = await supabase.from("site_pages").insert({
    route_path: routePath,
    page_name: pageName,
    is_published: false,
  });

  if (error) throw error;
  revalidatePath("/admin");
}

export async function updatePageStatus(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "");
  const isPublished = String(formData.get("is_published") || "") === "true";

  const { error } = await supabase
    .from("site_pages")
    .update({ is_published: isPublished })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin");
}

export async function createSection(formData: FormData) {
  const supabase = await requireAdmin();
  const pageId = String(formData.get("page_id") || "");
  const sectionType = String(formData.get("section_type") || "");
  const name = String(formData.get("name") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const sortOrder = Number(formData.get("sort_order") || 0);

  const { error } = await supabase.from("content_sections").insert({
    page_id: pageId,
    section_type: sectionType,
    name,
    title,
    description,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    is_published: false,
  });

  if (error) throw error;
  revalidatePath("/admin");
}

export async function createContentItem(formData: FormData) {
  const supabase = await requireAdmin();
  const sectionId = String(formData.get("section_id") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const link = String(formData.get("link") || "").trim();
  const sortOrder = Number(formData.get("sort_order") || 0);

  const { error } = await supabase.from("content_items").insert({
    section_id: sectionId,
    title,
    description,
    link,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    is_published: false,
  });

  if (error) throw error;
  revalidatePath("/admin");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
