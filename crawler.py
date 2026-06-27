import json
import time
import html
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

BASE_URL = "https://gall.dcinside.com/mgallery/board/lists/"
GALLERY_ID = "hyang"
HEADID = "20"
MAX_PAGE = 6000
STOP_THRESHOLD = 3

headers = {
    "User-Agent": "Mozilla/5.0"
}

def clean_url(href):
    parsed = urlparse(href)
    params = parse_qs(parsed.query)
    params.pop("page", None)
    clean_query = urlencode({k: v[0] for k, v in params.items()})
    return urlunparse(parsed._replace(query=clean_query))

def sanitize(text):
    return html.escape(text or "")

# 기존 data.json 로드
try:
    with open("data.json", "r", encoding="utf-8") as f:
        existing = json.load(f)
    print(f"기존 데이터 {len(existing)}개 로드 완료")
except FileNotFoundError:
    existing = []
    print("기존 data.json 없음, 새로 생성합니다")

seen = set(clean_url(item["url"]) for item in existing)
new_posts = []
stop = False
consecutive_seen = 0

for page in range(1, MAX_PAGE + 1):

    if stop:
        break

    url = (
        f"{BASE_URL}"
        f"?id={GALLERY_ID}"
        f"&headid={HEADID}"
        f"&page={page}"
    )

    try:
        r = requests.get(url, headers=headers, timeout=10)

        if r.status_code != 200:
            print(f"{page} 실패")
            continue

        soup = BeautifulSoup(r.text, "html.parser")
        rows = soup.select("tr.ub-content")
        count = 0

        for row in rows:

            subject = row.select_one("td.gall_subject")
            if not subject:
                continue

            if "시향기" not in subject.get_text(strip=True):
                continue

            title_tag = row.select_one("td.gall_tit a")
            if not title_tag:
                continue

            title = sanitize(title_tag.get_text(" ", strip=True))
            href = title_tag.get("href", "")
            if not href:
                continue

            if href.startswith("/"):
                href = "https://gall.dcinside.com" + href

            href = clean_url(href)

            if href in seen:
                consecutive_seen += 1
                if consecutive_seen >= STOP_THRESHOLD:
                    print(f"기존 글 {STOP_THRESHOLD}개 연속 발견, 수집 중단 ({page}페이지)")
                    stop = True
                    break
                continue

            consecutive_seen = 0
            new_posts.append({"title": title, "url": href})
            seen.add(href)
            count += 1

        print(f"{page} 완료 ({count}개)")
        time.sleep(0.2)

    except Exception as e:
        print(f"{page} 오류: {e}")

# 기존 데이터에서 new_posts와 중복된 항목 제거 후 합치기
new_urls = set(p["url"] for p in new_posts)
existing_deduped = [item for item in existing if clean_url(item["url"]) not in new_urls]
posts = new_posts + existing_deduped

with open("data.json", "w", encoding="utf-8") as f:
    json.dump(posts, f, ensure_ascii=False, indent=2)

print()
print(f"총 {len(posts)}개 저장 완료 (신규 {len(new_posts)}개 추가)")
