from __future__ import annotations

import hashlib
import json
import mimetypes
import re
import sys
import time
import uuid
from pathlib import Path
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, quote, unquote, urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen

from lxml import etree, html


OLD_BASE = "https://tech-literacy.vercel.app"
ROOT = Path(__file__).resolve().parents[1]
EXPORT_DIR = ROOT / "migration" / "legacy-site"
MEDIA_DIR = ROOT / "public" / "legacy-media"
SNAPSHOT_PATH = EXPORT_DIR / "snapshot.json"
IMPORT_SQL_PATH = EXPORT_DIR / "import.sql"
MANIFEST_PATH = EXPORT_DIR / "media-manifest.json"
NAMESPACE = uuid.UUID("1590a31e-1fb0-4ecb-b910-bbd20f69ab62")

SECTION_TYPES = (
    "Article",
    "Announcement",
    "IntroCard",
    "MeetTheTeam",
    "MindMap",
    "QuickLinkCard",
    "Timeline",
)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; tech-literacy2-migrator/1.0)",
    "Accept": "text/html,application/json,image/avif,image/webp,image/*,*/*",
}

MEDIA_BY_SOURCE: dict[str, dict[str, Any]] = {}
CURRENT_SOURCE_URLS: dict[str, str] = {}
CURRENT_OPTIMIZER_URLS: dict[str, str] = {}
MEDIA_ERRORS: list[dict[str, str]] = []


def load_existing_media() -> None:
    if not MANIFEST_PATH.exists():
        return
    try:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return
    for record in manifest.get("media") or []:
        local_path = ROOT / record.get("storage_path", "")
        source_url = record.get("source_url") or ""
        if source_url and local_path.is_file() and local_path.stat().st_size > 0:
            MEDIA_BY_SOURCE[source_identity(source_url)] = record


def fetch_bytes(url: str, attempts: int = 3) -> tuple[bytes, str]:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            request = Request(url, headers=HEADERS)
            with urlopen(request, timeout=60) as response:
                return response.read(), response.headers.get_content_type()
        except (HTTPError, URLError, TimeoutError) as error:
            last_error = error
            if attempt + 1 < attempts:
                time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Unable to fetch {url}: {last_error}")


def fetch_document(path: str) -> html.HtmlElement:
    url = urljoin(f"{OLD_BASE}/", path.lstrip("/"))
    parts = urlsplit(url)
    encoded_url = urlunsplit(
        (parts.scheme, parts.netloc, quote(parts.path, safe="/%"), parts.query, parts.fragment)
    )
    payload, _ = fetch_bytes(encoded_url)
    return html.fromstring(payload, base_url=OLD_BASE)


def text_content(node: etree._Element | None) -> str:
    if node is None:
        return ""
    return " ".join(node.text_content().split())


def inner_html(node: etree._Element | None) -> str:
    if node is None:
        return ""
    parts: list[str] = []
    if node.text and node.text.strip():
        parts.append(node.text.strip())
    for child in node:
        parts.append(
            etree.tostring(
                child,
                encoding="unicode",
                method="html",
                with_tail=True,
            ).strip()
        )
    return "\n".join(part for part in parts if part).strip()


def xpath_class(token: str) -> str:
    return (
        "contains(concat(' ', normalize-space(@class), ' '), "
        f"' {token} ')"
    )


def stable_uuid(key: str) -> str:
    return str(uuid.uuid5(NAMESPACE, key))


def source_identity(url: str) -> str:
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))


def cache_current_image_urls(document: html.HtmlElement) -> None:
    for image in document.xpath("//main//img"):
        image_src = image.get("src") or ""
        source = original_image_url(image_src)
        if source:
            identity = source_identity(source)
            CURRENT_SOURCE_URLS[identity] = source
            CURRENT_OPTIMIZER_URLS[identity] = urljoin(OLD_BASE, image_src)


def original_image_url(src: str) -> str:
    absolute = urljoin(OLD_BASE, src)
    parts = urlsplit(absolute)
    if parts.path == "/_next/image":
        nested = parse_qs(parts.query).get("url", [""])[0]
        if nested:
            return nested
    return absolute


def extension_for(mime_type: str, fallback_name: str) -> str:
    overrides = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/avif": ".avif",
        "image/gif": ".gif",
        "image/svg+xml": ".svg",
    }
    if mime_type in overrides:
        return overrides[mime_type]
    suffix = Path(fallback_name).suffix.lower()
    return suffix if suffix else mimetypes.guess_extension(mime_type) or ".bin"


def save_media(name: str, source_url: str) -> dict[str, str]:
    if not source_url:
        return {"name": name or "", "url": ""}
    if source_url.startswith("/images/") or source_url.startswith("/legacy-media/"):
        return {"name": name or Path(source_url).name, "url": source_url}

    source_url = original_image_url(source_url)
    identity = source_identity(source_url)
    source_url = CURRENT_SOURCE_URLS.get(identity, source_url)
    if identity in MEDIA_BY_SOURCE:
        record = MEDIA_BY_SOURCE[identity]
        return {"name": name or record["file_name"], "url": record["public_url"]}

    source_name = name or unquote(Path(urlsplit(identity).path).name) or "image"
    digest = hashlib.sha256(identity.encode("utf-8")).hexdigest()[:20]
    optimized_url = CURRENT_OPTIMIZER_URLS.get(identity) or (
        f"{OLD_BASE}/_next/image?url={quote(source_url, safe='')}&w=1920&q=82"
    )

    payload: bytes
    mime_type: str
    try:
        payload, mime_type = fetch_bytes(optimized_url, attempts=1)
        if not mime_type.startswith("image/"):
            raise RuntimeError(f"Unexpected optimized content type: {mime_type}")
    except Exception:
        try:
            payload, mime_type = fetch_bytes(source_url, attempts=1)
            if not mime_type.startswith("image/"):
                raise RuntimeError(f"Unexpected source content type: {mime_type}")
        except Exception as error:
            MEDIA_ERRORS.append({"source_url": source_url, "error": str(error)})
            return {"name": source_name, "url": ""}

    suffix = extension_for(mime_type, source_name)
    filename = f"{digest}{suffix}"
    destination = MEDIA_DIR / filename
    destination.write_bytes(payload)
    public_url = f"/legacy-media/{filename}"
    record = {
        "id": stable_uuid(f"media:{identity}"),
        "source_url": source_url,
        "storage_path": f"public/legacy-media/{filename}",
        "public_url": public_url,
        "file_name": source_name,
        "mime_type": mime_type,
        "size_bytes": len(payload),
    }
    MEDIA_BY_SOURCE[identity] = record
    return {"name": source_name, "url": public_url}


def image_from_node(image: etree._Element | None) -> dict[str, str]:
    if image is None:
        return {"name": "", "url": ""}
    image_src = image.get("src") or ""
    if not image_src:
        return {"name": image.get("alt") or "", "url": ""}
    source = original_image_url(image_src)
    if source:
        identity = source_identity(source)
        CURRENT_SOURCE_URLS[identity] = source
        CURRENT_OPTIMIZER_URLS[identity] = urljoin(OLD_BASE, image_src)
    return save_media(image.get("alt") or "", source)


def blank_item(key: str, sort_order: int = 0) -> dict[str, Any]:
    return {
        "key": key,
        "name": "",
        "title": "",
        "description": "",
        "link": "",
        "date": None,
        "image": {"name": "", "url": ""},
        "legacy_id": key,
        "bg_class": "",
        "shadow_class": "",
        "position": "",
        "sort_order": sort_order,
        "metadata": {},
        "items": [],
    }


def blank_section(
    key: str,
    section_type: str,
    name: str,
    sort_order: int,
) -> dict[str, Any]:
    return {
        "key": key,
        "section_type": section_type,
        "name": name,
        "title": "",
        "description": "",
        "image": {"name": "", "url": ""},
        "legacy_id": key,
        "sort_order": sort_order,
        "metadata": {},
        "items": [],
    }


def convert_api_item(
    raw: dict[str, Any],
    key: str,
    order: int,
    migrate_image: bool = True,
) -> dict[str, Any]:
    item = blank_item(key, order)
    image = raw.get("image") or {}
    item.update(
        {
            "name": raw.get("name") or "",
            "title": raw.get("title") or "",
            "description": raw.get("description") or "",
            "link": raw.get("link") or "",
            "date": raw.get("date") or None,
            "legacy_id": str(raw.get("ID") or key),
            "bg_class": raw.get("bgClass") or "",
            "shadow_class": raw.get("shadowClass") or "",
            "position": raw.get("position") or "",
            "metadata": {
                "duration": raw.get("duration") or "",
                "source": "legacy-api",
            },
        }
    )
    if migrate_image and image.get("url"):
        item["image"] = save_media(image.get("name") or "", image["url"])
    elif image.get("name"):
        item["image"]["name"] = image.get("name") or ""
    item["items"] = [
        convert_api_item(
            child,
            f"{key}:child:{index}",
            index,
            migrate_image=migrate_image,
        )
        for index, child in enumerate(raw.get("items") or [])
    ]
    return item


def scrape_home() -> dict[str, Any]:
    cache_buster = int(time.time())
    current_document = fetch_document(f"/?migration={cache_buster}")
    cache_current_image_urls(current_document)
    payload, _ = fetch_bytes(f"{OLD_BASE}/api?migration={cache_buster}")
    raw = json.loads(payload.decode("utf-8"))
    page = {
        "route_path": "/",
        "page_name": raw.get("PageName") or "",
        "legacy_id": "legacy-route:/",
        "sections": [],
    }
    section_order = 0
    for section_type in SECTION_TYPES:
        for index, raw_section in enumerate(raw.get(section_type) or []):
            name = raw_section.get("name") or f"{section_type}-{index + 1}"
            key = f"home:{section_type}:{name}"
            section = blank_section(key, section_type, name, section_order)
            section_order += 1
            images = raw_section.get("image") or []
            if isinstance(images, dict):
                images = [images]
            if images:
                first = images[0]
                if section_type == "Announcement" and (first.get("name") or "").lower() == "notify.png":
                    section["image"] = {"name": "notify.png", "url": "/images/notify.png"}
                else:
                    section["image"] = save_media(first.get("name") or "", first.get("url") or "")
                if len(images) > 1:
                    section["metadata"]["additional_images"] = [
                        save_media(image.get("name") or "", image.get("url") or "")
                        for image in images[1:]
                    ]
            section.update(
                {
                    "title": raw_section.get("title") or "",
                    "description": raw_section.get("description") or "",
                    "legacy_id": str(raw_section.get("ID") or key),
                    "items": [
                        convert_api_item(
                            item,
                            f"{key}:item:{item_index}",
                            item_index,
                            migrate_image=section_type != "Announcement",
                        )
                        for item_index, item in enumerate(raw_section.get("items") or [])
                    ],
                }
            )
            page["sections"].append(section)
    return page


def parse_mind_map_li(node: etree._Element, key: str, order: int) -> dict[str, Any]:
    item = blank_item(key, order)
    label_nodes = node.xpath("./a | ./div")
    label = label_nodes[0] if label_nodes else None
    item["title"] = text_content(label)
    if label is not None and label.tag == "a":
        item["link"] = label.get("href") or ""
    child_nodes = node.xpath("./ol/li")
    item["items"] = [
        parse_mind_map_li(child, f"{key}:child:{index}", index)
        for index, child in enumerate(child_nodes)
    ]
    return item


def scrape_about() -> dict[str, Any]:
    document = fetch_document("/about")
    page = {
        "route_path": "/about",
        "page_name": text_content(document.xpath("//main//h1")[0]),
        "legacy_id": "legacy-route:/about",
        "sections": [],
    }

    overview_node = document.get_element_by_id("ProjectOverview")
    overview = blank_section("about:ProjectOverview", "IntroCard", "ProjectOverview", 0)
    overview["title"] = text_content(overview_node.xpath(".//h2")[0])
    for index, heading in enumerate(overview_node.xpath(".//h4")):
        wrapper = heading.getparent()
        item = blank_item(f"about:ProjectOverview:item:{index}", index)
        item["title"] = text_content(heading)
        description = heading.getnext()
        if description is not None and description.tag == "div":
            item["description"] = inner_html(description)
        images = wrapper.xpath("./img")
        if images:
            item["image"] = image_from_node(images[0])
        overview["items"].append(item)
    page["sections"].append(overview)

    structure_node = document.get_element_by_id("ProjectStructure")
    structure = blank_section("about:ProjectStructure", "MindMap", "ProjectStructure", 1)
    structure["title"] = text_content(structure_node.xpath(".//h2")[0])
    mind_maps = structure_node.xpath(f".//div[{xpath_class('mind-map')}]")
    for index, mind_map in enumerate(mind_maps):
        item = blank_item(f"about:ProjectStructure:item:{index}", index)
        label_nodes = mind_map.xpath("./a | ./div")
        label = label_nodes[0] if label_nodes else None
        item["title"] = text_content(label)
        if label is not None and label.tag == "a":
            item["link"] = label.get("href") or ""
        classes = (mind_map.get("class") or "").split()
        item["bg_class"] = " ".join(value for value in classes if value.startswith("bg-"))
        item["shadow_class"] = " ".join(value for value in classes if value.startswith("shadow-"))
        item["items"] = [
            parse_mind_map_li(child, f"{item['key']}:child:{child_index}", child_index)
            for child_index, child in enumerate(mind_map.xpath("./ol/li"))
        ]
        structure["items"].append(item)
    page["sections"].append(structure)

    purpose_node = document.get_element_by_id("ProjectPurpose")
    purpose = blank_section("about:ProjectPurpose", "Article", "ProjectPurpose", 2)
    purpose["title"] = text_content(purpose_node.xpath(".//article/h4")[0])
    purpose_description = purpose_node.xpath(".//article/div")
    if purpose_description:
        purpose["description"] = inner_html(purpose_description[0])
    purpose_images = purpose_node.xpath("./img")
    if purpose_images:
        purpose["image"] = image_from_node(purpose_images[0])
    page["sections"].append(purpose)

    timeline_node = document.get_element_by_id("ProjectTimeline")
    timeline = blank_section("about:ProjectTimeline", "Timeline", "ProjectTimeline", 3)
    timeline["title"] = text_content(timeline_node.xpath(".//h2")[0])
    for index, timeline_item in enumerate(timeline_node.xpath(f".//div[{xpath_class('timeline-item')}]")):
        item = blank_item(f"about:ProjectTimeline:item:{index}", index)
        headings = timeline_item.xpath("./h4")
        durations = timeline_item.xpath("./h5")
        descriptions = timeline_item.xpath("./div")
        item["title"] = text_content(headings[0]) if headings else ""
        item["description"] = inner_html(descriptions[0]) if descriptions else ""
        item["metadata"]["duration"] = text_content(durations[0]) if durations else ""
        timeline["items"].append(item)
    page["sections"].append(timeline)
    return page


def scrape_announcement_section(
    document: html.HtmlElement,
    section_id: str,
    key_prefix: str,
    sort_order: int,
) -> dict[str, Any]:
    node = document.get_element_by_id(section_id)
    section = blank_section(key_prefix, "Announcement", section_id, sort_order)
    title_nodes = node.xpath(".//h2")
    section["title"] = text_content(title_nodes[0]) if title_nodes else ""
    links = node.xpath(".//a[.//h3]")
    for index, link in enumerate(links):
        item = blank_item(f"{key_prefix}:item:{index}", index)
        item["link"] = link.get("href") or ""
        heading = link.xpath(".//h3")
        item["title"] = text_content(heading[0]) if heading else ""
        if heading:
            description = heading[0].getnext()
            if description is not None and description.tag == "div":
                item["description"] = inner_html(description)
        section["items"].append(item)
    return section


def scrape_expertise() -> tuple[dict[str, Any], list[dict[str, Any]]]:
    document = fetch_document("/expertise")
    page = {
        "route_path": "/expertise",
        "page_name": text_content(document.xpath("//main//h1")[0]),
        "legacy_id": "legacy-route:/expertise",
        "sections": [],
    }
    page["sections"].append(
        scrape_announcement_section(
            document,
            "ExpertiseAnnouncement",
            "expertise:ExpertiseAnnouncement",
            0,
        )
    )

    description_node = document.get_element_by_id("ExpertiseDescription")
    article_names = (
        "ExpertiseDescription",
        "ExpertiseApplication",
        "ExpertiseRelatedRegulatoryDocuments",
    )
    article_headings = description_node.xpath(".//h3")
    for index, (name, heading) in enumerate(zip(article_names, article_headings, strict=False)):
        section = blank_section(f"expertise:{name}", "Article", name, index + 1)
        section["title"] = text_content(heading)
        description = heading.getnext()
        if description is not None and description.tag == "div":
            section["description"] = inner_html(description)
        page["sections"].append(section)

    records: list[dict[str, Any]] = []
    list_node = document.get_element_by_id("ExpertiseList")
    for category_index, heading in enumerate(list_node.xpath(".//h2")):
        category = text_content(heading)
        grid = heading.getnext()
        if grid is None:
            continue
        for item_index, card in enumerate(grid.xpath("./div")):
            values = card.xpath("./div")
            if len(values) < 2:
                continue
            name = text_content(values[0])
            legacy_id = text_content(values[1])
            records.append(
                {
                    "key": f"expertise-record:{category}:{legacy_id}:{name}",
                    "legacy_id": legacy_id,
                    "name": name,
                    "category": category,
                    "sort_order": category_index * 100 + item_index,
                }
            )
    return page, records


def scrape_partner() -> dict[str, Any]:
    document = fetch_document("/partner")
    page = {
        "route_path": "/partner",
        "page_name": text_content(document.xpath("//main//h1")[0]),
        "legacy_id": "legacy-route:/partner",
        "sections": [],
    }
    node = document.get_element_by_id("PartnerQuickCard")
    section = blank_section("partner:PartnerQuickCard", "QuickLinkCard", "PartnerQuickCard", 0)
    links = node.xpath(".//a[starts-with(@href, '/partner/')]")
    for index, link in enumerate(links):
        item = blank_item(f"partner:PartnerQuickCard:item:{index}", index)
        item["title"] = text_content(link.xpath(".//h4")[0])
        item["link"] = link.get("href") or ""
        images = link.xpath(".//img")
        if images:
            item["image"] = image_from_node(images[0])
        section["items"].append(item)
    page["sections"].append(section)
    return page


def scrape_activity_page() -> tuple[dict[str, Any], list[str]]:
    document = fetch_document("/activity")
    page = {
        "route_path": "/activity",
        "page_name": text_content(document.xpath("//main//h1")[0]),
        "legacy_id": "legacy-route:/activity",
        "sections": [
            scrape_announcement_section(
                document,
                "ActivityAnnouncement",
                "activity:ActivityAnnouncement",
                0,
            )
        ],
    }
    links = sorted(
        {
            anchor.get("href") or ""
            for anchor in document.xpath("//main//a[@href]")
            if re.match(r"^/(partner|expertise)/[^/]+/[^/]+$", anchor.get("href") or "")
        }
    )
    return page, links


def scrape_courses() -> list[dict[str, Any]]:
    document = fetch_document("/courses")
    rows = document.xpath("//section[@id='CourseTable']//tbody/tr")
    courses: list[dict[str, Any]] = []
    current_category = ""
    for order, row in enumerate(rows):
        cells = row.xpath("./td")
        if len(cells) == 6:
            current_category = text_content(cells[0])
            data_cells = cells[2:]
        elif len(cells) == 4:
            data_cells = cells
        else:
            continue
        link_nodes = data_cells[0].xpath(".//a")
        if not link_nodes:
            continue
        href = link_nodes[0].get("href") or ""
        slug = unquote(href.rsplit("/", 1)[-1])
        course = {
            "key": f"course:{slug}",
            "name": text_content(link_nodes[0]),
            "title": slug.replace("-", " "),
            "credits": text_content(data_cells[1]),
            "course_type": text_content(data_cells[2]),
            "year": "",
            "category": current_category,
            "notes": text_content(data_cells[3]),
            "main_image": {"name": "", "url": ""},
            "goals": "",
            "outline": "",
            "assessment": "",
            "schedule": "",
            "references_text": "",
            "highlights": [],
            "legacy_id": slug,
            "sort_order": order,
        }
        detail = fetch_document(href)
        main_images = detail.xpath("//main//img")
        if main_images and (main_images[0].get("src") or ""):
            course["main_image"] = image_from_node(main_images[0])

        tab_lists = detail.xpath(f"//div[{xpath_class('tab-container')}]//ul")
        tab_contents = detail.xpath(f"//div[{xpath_class('tab-content')}]")
        if tab_lists and tab_contents:
            labels = tab_lists[0].xpath("./li")
            values = tab_contents[0].xpath("./div")
            raw_values = [inner_html(value) for value in values]
            for index, field in enumerate(("goals", "outline", "assessment", "references_text")):
                if index < len(raw_values):
                    course[field] = raw_values[index]
            course["metadata"] = {
                "tab_labels": [text_content(label) for label in labels],
                "source_path": href,
            }

        info_headings = detail.xpath("//main//h5")
        unique_info: list[tuple[str, etree._Element]] = []
        seen_titles: set[str] = set()
        for heading in info_headings:
            title = text_content(heading)
            if title in seen_titles:
                continue
            seen_titles.add(title)
            unique_info.append((title, heading))
        if unique_info:
            schedule_node = unique_info[0][1].getnext()
            if schedule_node is not None:
                course["schedule"] = inner_html(schedule_node)
        if len(unique_info) > 1:
            info_node = unique_info[1][1].getnext()
            info_text = text_content(info_node)
            match = re.search(r"開課年級[：:]\s*([^\s]+)", info_text)
            if match:
                course["year"] = match.group(1)

        seen_images: set[str] = set()
        main_identity = ""
        if main_images and (main_images[0].get("src") or ""):
            main_identity = source_identity(original_image_url(main_images[0].get("src") or ""))
        highlights: list[dict[str, str]] = []
        for image in main_images[1:]:
            image_src = image.get("src") or ""
            if not image_src:
                continue
            source = original_image_url(image_src)
            identity = source_identity(source)
            if not identity or identity == main_identity or identity in seen_images:
                continue
            seen_images.add(identity)
            highlights.append(save_media(image.get("alt") or "", source))
        course["highlights"] = [image for image in highlights if image.get("url")]
        courses.append(course)
    return courses


def scrape_activities(paths: Iterable[str]) -> list[dict[str, Any]]:
    activities: list[dict[str, Any]] = []
    for path in paths:
        document = fetch_document(path)
        parts = [unquote(part) for part in path.split("/") if part]
        if len(parts) != 3:
            continue
        activity_type = parts[1]
        legacy_id = parts[2]
        headings = document.xpath("//main//h1")
        title = text_content(headings[0]) if headings else ""
        content_headings = document.xpath("//main//h3")
        description = ""
        if content_headings:
            description_node = content_headings[-1].getnext()
            if description_node is not None and description_node.tag == "div":
                description = inner_html(description_node)
        images: list[dict[str, str]] = []
        seen: set[str] = set()
        for image in document.xpath("//main//img"):
            source = original_image_url(image.get("src") or "")
            identity = source_identity(source)
            if not identity or identity in seen:
                continue
            seen.add(identity)
            saved = save_media(image.get("alt") or "", source)
            if saved.get("url"):
                images.append(saved)
        try:
            sort_order = int(legacy_id)
        except ValueError:
            sort_order = len(activities)
        activities.append(
            {
                "key": f"activity:{path}",
                "legacy_id": legacy_id,
                "title": title,
                "description": description,
                "activity_type": activity_type,
                "link": path,
                "images": images,
                "sort_order": sort_order,
            }
        )
    return activities


def reconcile_announcement_images(
    pages: list[dict[str, Any]],
    activities: list[dict[str, Any]],
) -> None:
    by_link = {activity["link"]: activity for activity in activities}
    for page in pages:
        for section in page["sections"]:
            if section["section_type"] != "Announcement":
                continue
            for item in section.get("items") or []:
                activity = by_link.get(item.get("link") or "")
                images = activity.get("images") if activity else []
                if images and not item.get("image", {}).get("url"):
                    item["image"] = images[0]


def sql_literal(value: Any) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (dict, list)):
        payload = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
        return "'" + payload.replace("'", "''") + "'::jsonb"
    return "'" + str(value).replace("'", "''") + "'"


def flatten_items(
    section_id: str,
    items: list[dict[str, Any]],
    parent_id: str | None = None,
) -> Iterable[tuple[str, str | None, dict[str, Any]]]:
    for item in items:
        item_id = stable_uuid(f"item:{item['key']}")
        yield item_id, parent_id, item
        yield from flatten_items(section_id, item.get("items") or [], item_id)


def generate_import_sql(snapshot: dict[str, Any]) -> str:
    statements = [
        "begin;",
        "alter table public.activities add column if not exists images jsonb not null default '[]'::jsonb;",
    ]
    for page in snapshot["pages"]:
        page_id = stable_uuid(f"page:{page['route_path']}")
        values = ", ".join(
            [
                sql_literal(page_id),
                sql_literal(page["route_path"]),
                sql_literal(page["page_name"]),
                sql_literal(page["legacy_id"]),
                "true",
            ]
        )
        statements.append(
            "insert into public.site_pages (id, route_path, page_name, legacy_id, is_published) "
            f"values ({values}) on conflict (id) do update set "
            "route_path=excluded.route_path, page_name=excluded.page_name, "
            "legacy_id=excluded.legacy_id, is_published=excluded.is_published, updated_at=now();"
        )
        for section in page["sections"]:
            section_id = stable_uuid(f"section:{section['key']}")
            image = section.get("image") or {}
            values = ", ".join(
                [
                    sql_literal(section_id),
                    sql_literal(page_id),
                    sql_literal(section["section_type"]),
                    sql_literal(section["name"]),
                    sql_literal(section["title"]),
                    sql_literal(section["description"]),
                    sql_literal(image.get("url") or None),
                    sql_literal(image.get("name") or None),
                    sql_literal(section["legacy_id"]),
                    str(section["sort_order"]),
                    "true",
                    sql_literal(section.get("metadata") or {}),
                ]
            )
            statements.append(
                "insert into public.content_sections "
                "(id, page_id, section_type, name, title, description, image_url, image_name, legacy_id, sort_order, is_published, metadata) "
                f"values ({values}) on conflict (id) do update set "
                "page_id=excluded.page_id, section_type=excluded.section_type, name=excluded.name, "
                "title=excluded.title, description=excluded.description, image_url=excluded.image_url, "
                "image_name=excluded.image_name, legacy_id=excluded.legacy_id, sort_order=excluded.sort_order, "
                "is_published=excluded.is_published, metadata=excluded.metadata, updated_at=now();"
            )
            for item_id, parent_id, item in flatten_items(section_id, section.get("items") or []):
                image = item.get("image") or {}
                values = ", ".join(
                    [
                        sql_literal(item_id),
                        sql_literal(section_id),
                        sql_literal(parent_id),
                        sql_literal(item.get("name") or ""),
                        sql_literal(item.get("title") or ""),
                        sql_literal(item.get("description") or ""),
                        sql_literal(item.get("link") or ""),
                        sql_literal(item.get("date")),
                        sql_literal(image.get("url") or None),
                        sql_literal(image.get("name") or None),
                        sql_literal(item.get("legacy_id") or item["key"]),
                        sql_literal(item.get("bg_class") or None),
                        sql_literal(item.get("shadow_class") or None),
                        sql_literal(item.get("position") or None),
                        str(item.get("sort_order") or 0),
                        "true",
                        sql_literal(item.get("metadata") or {}),
                    ]
                )
                statements.append(
                    "insert into public.content_items "
                    "(id, section_id, parent_id, name, title, description, link, date, image_url, image_name, legacy_id, bg_class, shadow_class, position, sort_order, is_published, metadata) "
                    f"values ({values}) on conflict (id) do update set "
                    "section_id=excluded.section_id, parent_id=excluded.parent_id, name=excluded.name, "
                    "title=excluded.title, description=excluded.description, link=excluded.link, date=excluded.date, "
                    "image_url=excluded.image_url, image_name=excluded.image_name, legacy_id=excluded.legacy_id, "
                    "bg_class=excluded.bg_class, shadow_class=excluded.shadow_class, position=excluded.position, "
                    "sort_order=excluded.sort_order, is_published=excluded.is_published, metadata=excluded.metadata, updated_at=now();"
                )

    for course in snapshot["courses"]:
        course_id = stable_uuid(course["key"])
        main_image = course.get("main_image") or {}
        values = ", ".join(
            [
                sql_literal(course_id),
                sql_literal(course["name"]),
                sql_literal(course["title"]),
                sql_literal(course["credits"]),
                sql_literal(course["course_type"]),
                sql_literal(course["year"]),
                sql_literal(course["category"]),
                sql_literal(course["notes"]),
                sql_literal(main_image.get("url") or None),
                sql_literal(main_image.get("name") or None),
                sql_literal(course["goals"]),
                sql_literal(course["outline"]),
                sql_literal(course["assessment"]),
                sql_literal(course["schedule"]),
                sql_literal(course["references_text"]),
                sql_literal(course["highlights"]),
                sql_literal(course["legacy_id"]),
                str(course["sort_order"]),
                "true",
            ]
        )
        statements.append(
            "insert into public.courses "
            "(id, name, title, credits, course_type, year, category, notes, main_image_url, main_image_name, goals, outline, assessment, schedule, references_text, highlights, legacy_id, sort_order, is_published) "
            f"values ({values}) on conflict (id) do update set "
            "name=excluded.name, title=excluded.title, credits=excluded.credits, course_type=excluded.course_type, "
            "year=excluded.year, category=excluded.category, notes=excluded.notes, main_image_url=excluded.main_image_url, "
            "main_image_name=excluded.main_image_name, goals=excluded.goals, outline=excluded.outline, "
            "assessment=excluded.assessment, schedule=excluded.schedule, references_text=excluded.references_text, "
            "highlights=excluded.highlights, legacy_id=excluded.legacy_id, sort_order=excluded.sort_order, "
            "is_published=excluded.is_published, updated_at=now();"
        )

    for record in snapshot["expertise_records"]:
        record_id = stable_uuid(record["key"])
        values = ", ".join(
            [
                sql_literal(record_id),
                sql_literal(record["name"]),
                sql_literal(record["category"]),
                sql_literal(record["legacy_id"]),
                str(record["sort_order"]),
                "true",
            ]
        )
        statements.append(
            "insert into public.expertise_records (id, name, category, legacy_id, sort_order, is_published) "
            f"values ({values}) on conflict (id) do update set "
            "name=excluded.name, category=excluded.category, legacy_id=excluded.legacy_id, "
            "sort_order=excluded.sort_order, is_published=excluded.is_published, updated_at=now();"
        )

    for activity in snapshot["activities"]:
        activity_id = stable_uuid(activity["key"])
        images = activity.get("images") or []
        first_image = images[0] if images else {}
        values = ", ".join(
            [
                sql_literal(activity_id),
                sql_literal(activity["title"]),
                sql_literal(activity["description"]),
                sql_literal(activity["activity_type"]),
                sql_literal(activity["link"]),
                sql_literal(first_image.get("url") or None),
                sql_literal(first_image.get("name") or None),
                sql_literal(activity["legacy_id"]),
                "true",
                str(activity["sort_order"]),
                sql_literal(images),
            ]
        )
        statements.append(
            "insert into public.activities "
            "(id, title, description, activity_type, link, image_url, image_name, legacy_id, is_published, sort_order, images) "
            f"values ({values}) on conflict (id) do update set "
            "title=excluded.title, description=excluded.description, activity_type=excluded.activity_type, "
            "link=excluded.link, image_url=excluded.image_url, image_name=excluded.image_name, legacy_id=excluded.legacy_id, "
            "is_published=excluded.is_published, sort_order=excluded.sort_order, images=excluded.images, updated_at=now();"
        )

    for media in snapshot["media"]:
        values = ", ".join(
            [
                sql_literal(media["id"]),
                sql_literal(media["storage_path"]),
                sql_literal(media["public_url"]),
                sql_literal(media["file_name"]),
                sql_literal(media["file_name"]),
                sql_literal(media["mime_type"]),
                str(media["size_bytes"]),
            ]
        )
        statements.append(
            "insert into public.media_assets (id, storage_path, public_url, file_name, alt_text, mime_type, size_bytes) "
            f"values ({values}) on conflict (id) do update set "
            "storage_path=excluded.storage_path, public_url=excluded.public_url, file_name=excluded.file_name, "
            "alt_text=excluded.alt_text, mime_type=excluded.mime_type, size_bytes=excluded.size_bytes;"
        )

    statements.extend(
        [
            "commit;",
            "analyze public.site_pages;",
            "analyze public.content_sections;",
            "analyze public.content_items;",
            "analyze public.courses;",
            "analyze public.expertise_records;",
            "analyze public.activities;",
        ]
    )
    return "\n".join(statements) + "\n"


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    load_existing_media()

    home = scrape_home()
    about = scrape_about()
    expertise_page, expertise_records = scrape_expertise()
    partner = scrape_partner()
    activity_page, activity_paths = scrape_activity_page()
    courses = scrape_courses()
    activities = scrape_activities(activity_paths)
    pages = [home, about, expertise_page, partner, activity_page]
    reconcile_announcement_images(pages, activities)

    snapshot = {
        "source": OLD_BASE,
        "pages": pages,
        "courses": courses,
        "expertise_records": expertise_records,
        "activities": activities,
        "media": sorted(MEDIA_BY_SOURCE.values(), key=lambda item: item["public_url"]),
        "media_errors": MEDIA_ERRORS,
    }
    SNAPSHOT_PATH.write_text(
        json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    MANIFEST_PATH.write_text(
        json.dumps(
            {"media": snapshot["media"], "errors": MEDIA_ERRORS},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    IMPORT_SQL_PATH.write_text(generate_import_sql(snapshot), encoding="utf-8")

    section_count = sum(len(page["sections"]) for page in snapshot["pages"])

    def count_items(items: list[dict[str, Any]]) -> int:
        return sum(1 + count_items(item.get("items") or []) for item in items)

    item_count = sum(
        count_items(section.get("items") or [])
        for page in snapshot["pages"]
        for section in page["sections"]
    )
    summary = {
        "pages": len(snapshot["pages"]),
        "sections": section_count,
        "content_items": item_count,
        "courses": len(courses),
        "expertise_records": len(expertise_records),
        "activities": len(activities),
        "media": len(snapshot["media"]),
        "media_errors": len(MEDIA_ERRORS),
        "media_bytes": sum(item["size_bytes"] for item in snapshot["media"]),
        "snapshot": str(SNAPSHOT_PATH),
        "sql": str(IMPORT_SQL_PATH),
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0 if not MEDIA_ERRORS else 2


if __name__ == "__main__":
    raise SystemExit(main())
