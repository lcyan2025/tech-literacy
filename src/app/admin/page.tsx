import { redirect } from "next/navigation";

import {
  createContentItem,
  createPage,
  createSection,
  signOut,
  updatePageStatus,
} from "@/app/admin/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const sectionTypes = [
  "Article",
  "Announcement",
  "IntroCard",
  "MeetTheTeam",
  "MindMap",
  "QuickLinkCard",
  "Timeline",
];

export const dynamic = "force-dynamic";

export default async function AdminPage() {
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

  const [{ data: pages, error: pagesError }, { data: sections, error: sectionsError }, { data: items, error: itemsError }] =
    await Promise.all([
      supabase
        .from("site_pages")
        .select("id, route_path, page_name, is_published")
        .order("route_path"),
      supabase
        .from("content_sections")
        .select("id, page_id, section_type, name, title, is_published")
        .order("page_id")
        .order("sort_order"),
      supabase
        .from("content_items")
        .select("id, section_id, title, is_published")
        .order("section_id")
        .order("sort_order"),
    ]);

  if (pagesError) throw pagesError;
  if (sectionsError) throw sectionsError;
  if (itemsError) throw itemsError;

  const pageRows = pages || [];
  const sectionRows = sections || [];
  const itemRows = items || [];

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">tech-literacy2 CMS</p>
          <h1 className="text-3xl font-semibold text-gray-900">內容管理</h1>
          <p className="mt-2 text-sm text-gray-600">
            目前登入：{user.email || "管理者"}（{profile.role}）
          </p>
        </div>
        <form action={signOut}>
          <button className="rounded border px-4 py-2 text-sm" type="submit">
            登出
          </button>
        </form>
      </header>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">新增頁面</h2>
        <form action={createPage} className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            className="rounded border px-3 py-2"
            name="route_path"
            placeholder="/new-page"
            required
          />
          <input
            className="rounded border px-3 py-2"
            name="page_name"
            placeholder="頁面名稱"
            required
          />
          <button className="rounded bg-denim-700 px-4 py-2 text-white" type="submit">
            新增頁面
          </button>
        </form>
      </section>

      <section className="space-y-5">
        <h2 className="text-xl font-semibold">頁面與內容區塊</h2>
        {pageRows.map((page) => {
          const pageSections = sectionRows.filter((section) => section.page_id === page.id);
          return (
            <article key={page.id} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{page.page_name}</h3>
                  <p className="text-sm text-gray-500">{page.route_path}</p>
                </div>
                <form action={updatePageStatus}>
                  <input type="hidden" name="id" value={page.id} />
                  <input
                    type="hidden"
                    name="is_published"
                    value={String(!page.is_published)}
                  />
                  <button className="rounded border px-3 py-1.5 text-sm" type="submit">
                    {page.is_published ? "下架頁面" : "發布頁面"}
                  </button>
                </form>
              </div>

              <form action={createSection} className="grid gap-3 border-t pt-4 md:grid-cols-5">
                <input type="hidden" name="page_id" value={page.id} />
                <select className="rounded border px-3 py-2" name="section_type" defaultValue="Article">
                  {sectionTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
                <input className="rounded border px-3 py-2" name="name" placeholder="區塊識別名稱" required />
                <input className="rounded border px-3 py-2" name="title" placeholder="區塊標題" />
                <input className="rounded border px-3 py-2" name="sort_order" type="number" defaultValue="0" />
                <button className="rounded bg-gray-800 px-4 py-2 text-white" type="submit">
                  新增區塊
                </button>
                <textarea className="rounded border px-3 py-2 md:col-span-5" name="description" placeholder="區塊內容，可使用受控 HTML" />
              </form>

              <div className="space-y-3">
                {pageSections.map((section) => {
                  const sectionItems = itemRows.filter((item) => item.section_id === section.id);
                  return (
                    <div key={section.id} className="rounded-xl border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{section.title || section.name}</p>
                          <p className="text-xs text-gray-500">
                            {section.section_type} · {section.is_published ? "已發布" : "草稿"}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {sectionItems.length} 筆項目
                        </span>
                      </div>

                      {sectionItems.length > 0 && (
                        <ul className="mt-3 space-y-1 text-sm text-gray-700">
                          {sectionItems.map((item) => (
                            <li key={item.id}>
                              {item.title || "未命名項目"} · {item.is_published ? "已發布" : "草稿"}
                            </li>
                          ))}
                        </ul>
                      )}

                      <form action={createContentItem} className="mt-4 grid gap-3 border-t pt-3 md:grid-cols-4">
                        <input type="hidden" name="section_id" value={section.id} />
                        <input className="rounded border px-3 py-2" name="title" placeholder="項目標題" required />
                        <input className="rounded border px-3 py-2" name="link" placeholder="連結 URL" />
                        <input className="rounded border px-3 py-2" name="sort_order" type="number" defaultValue="0" />
                        <button className="rounded bg-gray-700 px-4 py-2 text-white" type="submit">
                          新增項目
                        </button>
                        <textarea className="rounded border px-3 py-2 md:col-span-4" name="description" placeholder="項目內容" />
                      </form>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
