#!/usr/bin/env python3
"""
Simple HAR extractor: finds text snippets, media URLs and post URLs from a HAR file.

Usage: python3 scripts/extract_har_items.py /path/to/www.facebook.com.har.txt
"""
import json
import re
import sys
from urllib.parse import urlparse
from collections import OrderedDict
import html

try:
    from bs4 import BeautifulSoup
    HAVE_BS4 = True
except Exception:
    HAVE_BS4 = False

MEDIA_EXT_RE = re.compile(r"https?://[^\s\"'>]+\.(?:png|jpg|jpeg|gif|bmp|svg|webp|mp4|webm|mov)", re.I)
URL_RE = re.compile(r"https?://[^\s\"'>]+")

TEXT_FIELD_RE = re.compile(r'"(message|text|story|description|title|name|caption|snippet)"\s*:\s*"((?:\\.|[^"\\])*)"', re.I)

def unescape_json_string(s):
    try:
        dec = json.loads('"' + s + '"')
    except Exception:
        dec = s
    try:
        return html.unescape(dec)
    except Exception:
        return dec

def find_media_urls(text):
    if not text:
        return []
    return list(OrderedDict.fromkeys(MEDIA_EXT_RE.findall(text)))

def filter_media_urls(urls):
    """
    Filter media URLs to prefer long URLs with query parameters.
    Short URLs without query parameters are excluded.
    If all URLs are short, returns the original list.
    """
    if not urls:
        return urls
    
    # Separate long URLs (with query parameters) from short URLs
    long_urls = [url for url in urls if '?' in url]
    
    # Return long URLs if any exist, otherwise return all URLs
    return long_urls if long_urls else urls

def search_json_for_text(obj, max_depth=10):
    """Recursively search a JSON object for text/message fields."""
    texts = []
    if max_depth <= 0:
        return texts
    if isinstance(obj, dict):
        # Look for text-like fields
        for key in ('message', 'text', 'story', 'description', 'title', 'name', 'caption', 'snippet', 'content', 'body'):
            val = obj.get(key)
            if isinstance(val, str) and val.strip() and len(val) > 80:  # Meaningful text (at least 80 chars)
                texts.append(val)
        for v in obj.values():
            texts.extend(search_json_for_text(v, max_depth - 1))
    elif isinstance(obj, list):
        for item in obj:
            texts.extend(search_json_for_text(item, max_depth - 1))
    return texts

def extract_text_from_html(html):
    if not html:
        return None
    if HAVE_BS4:
        soup = BeautifulSoup(html, 'lxml')
        meta = {}
        for tag in soup.find_all('meta'):
            if tag.get('property'):
                meta[tag.get('property')] = tag.get('content')
            if tag.get('name'):
                meta[tag.get('name')] = tag.get('content')
        for k in ('og:description', 'og:title', 'description', 'twitter:description'):
            if meta.get(k):
                return meta.get(k)
        p = soup.find('p')
        if p and p.get_text(strip=True):
            return p.get_text(separator=' ', strip=True)
        txt = soup.get_text(separator=' ', strip=True)
        if txt:
            return ' '.join(txt.split()[:60])
        return None
    # fallback without BeautifulSoup: simple regex-based extraction
    # look for og:description / og:title
    m = re.search(r'<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']+)["\']', html, re.I)
    if not m:
        m = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']', html, re.I)
    if m:
        return m.group(1)
    p = re.search(r'<p[^>]*>(.*?)</p>', html, re.I | re.S)
    if p:
        txt = re.sub(r'<[^>]+>', '', p.group(1)).strip()
        if txt:
            return ' '.join(txt.split()[:60])
    # last resort: strip tags and return snippet
    txt = re.sub(r'<[^>]+>', '', html)
    txt = re.sub(r'\s+', ' ', txt).strip()
    if txt:
        return ' '.join(txt.split()[:60])
    return None

def get_response_size(entry):
    """Calculate response size in bytes."""
    try:
        res = entry.get('response', {})
        if not isinstance(res, dict):
            return 0
        # Try to use _transferSize first (actual bytes transferred)
        if '_transferSize' in res:
            return res.get('_transferSize', 0)
        # fallback to bodySize
        if 'bodySize' in res:
            size = res.get('bodySize', 0)
            return size if size > 0 else 0
        # fallback to content text length
        content = res.get('content', {})
        if isinstance(content, dict) and 'text' in content:
            text = content['text']
            if isinstance(text, str):
                return len(text.encode('utf-8'))
        return 0
    except Exception:
        return 0

def parse_textual_har(text):
    results = []
    # Improved media URL regex: capture full Facebook image/video URLs with parameters
    media_pattern = re.compile(r'https?://[^\s"\'<>]+/(?:v/|photo|video|image)[^\s"\'<>]*|https?://(?:scontent|video|photos|images)[^\s"\'<>]*\.(?:fbcdn\.net|instagram\.com)[^\s"\'<>]*', re.I)
    media_pos = [(m.start(), m.group(0)) for m in media_pattern.finditer(text)]
    post_pattern = re.compile(r'https?://[^\s"\'>]*/(?:groups/[^/]+/posts/\d+|photo(?:\.php|/)|permalink.php|posts/\d+|story.php)[^\s"\'>]*', re.I)
    post_pos = [(m.start(), m.group(0)) for m in post_pattern.finditer(text)]
    # broader set of candidate text keys
    text_field_re = re.compile(r'"(message|text|story|description|title|name|caption|snippet)"\s*:\s*"((?:\\.|[^"\\])*)"', re.I)
    text_pos = [(m.start(), m.group(2)) for m in text_field_re.finditer(text)]

    # use module-level unescape_json_string to decode escaped JSON strings and HTML entities

    used_media = set()
    for ppos, purl in post_pos:
        txt = None
        # prefer nearest preceding text within 2000 chars
        for tpos, tval in reversed(text_pos):
            if tpos < ppos and ppos - tpos < 2000:
                txt = unescape_json_string(tval)
                break
        # if none preceding, try nearest following text within 2000 chars
        if txt is None:
            for tpos, tval in text_pos:
                if tpos > ppos and tpos - ppos < 2000:
                    txt = unescape_json_string(tval)
                    break
        murls = []
        for mpos, murl in media_pos:
            if ppos <= mpos <= ppos + 2000 and murl not in used_media:
                murls.append(murl)
                used_media.add(murl)
        results.append({'text': txt, 'media_urls': murls, 'post_url': purl})

    if not results:
        if media_pos:
            cluster = []
            current_cluster = [media_pos[0]]
            for m in media_pos[1:]:
                if m[0] - current_cluster[-1][0] < 2000:
                    current_cluster.append(m)
                else:
                    cluster.append(current_cluster)
                    current_cluster = [m]
            cluster.append(current_cluster)
            for c in cluster:
                murls = [u for _, u in c]
                first_pos = c[0][0]
                txt = None
                for tpos, tval in reversed(text_pos):
                    if tpos < first_pos and first_pos - tpos < 2000:
                        txt = unescape_json_string(tval)
                        break
                results.append({'text': txt, 'media_urls': murls, 'post_url': None})
        else:
            for tpos, tval in text_pos:
                results.append({'text': unescape_json_string(tval), 'media_urls': [], 'post_url': None})

    # also include standalone text matches not already associated with media/posts
    try:
        existing_texts = set((r.get('text') or '').strip()[:200] for r in results)
        for tpos, tval in text_pos:
            ut = unescape_json_string(tval).strip()
            if not ut:
                continue
            if len(ut) >= 80 and ut[:200] not in existing_texts:
                results.append({'text': ut, 'media_urls': [], 'post_url': None})
                existing_texts.add(ut[:200])
    except Exception:
        pass

    seen = set()
    out = []
    for r in results:
        key = (r.get('post_url') or '') + '|' + (r.get('text') or '')[:200]
        if key in seen:
            continue
        seen.add(key)
        out.append(r)
    return out
    

def main(path, min_size_kb=0):
    """
    Extract items from HAR file.
    
    Args:
        path: Path to HAR file
        min_size_kb: Minimum response size in KB (0 = no filter)
    """
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    try:
        data = json.loads(content)
    except Exception:
        fallback = parse_textual_har(content)
        print(json.dumps(fallback, indent=2, ensure_ascii=False))
        sys.exit(0)

    entries = []
    if isinstance(data, dict) and 'log' in data and 'entries' in data['log']:
        entries = data['log']['entries']
    elif isinstance(data, dict) and 'entries' in data:
        entries = data['entries']
    else:
        print('No HAR entries found', file=sys.stderr)
        sys.exit(1)

    results = []
    seen = set()
    min_size_bytes = min_size_kb * 1024
    
    for e in entries:
        # Filter by response size if specified
        if min_size_kb > 0:
            res_size = get_response_size(e)
            if res_size < min_size_bytes:
                continue
        
        try:
            req = e.get('request', {})
            res = e.get('response', {})
            req_url = req.get('url') if isinstance(req, dict) else None
            post_url = None
            text = None
            media = []

            # try response content
            content_field = res.get('content', {}) if isinstance(res, dict) else {}
            mime = content_field.get('mimeType') if isinstance(content_field, dict) else None
            cont_text = content_field.get('text') if isinstance(content_field, dict) else None

            if cont_text and cont_text.strip().startswith('<'):
                text = extract_text_from_html(cont_text)
                # look for og:url and og:image inside HTML
                if HAVE_BS4:
                    soup = BeautifulSoup(cont_text, 'lxml')
                    og_url = None
                    og_image = None
                    for tag in soup.find_all('meta'):
                        if tag.get('property') == 'og:url' and tag.get('content'):
                            og_url = tag.get('content')
                        if tag.get('property') == 'og:image' and tag.get('content'):
                            og_image = tag.get('content')
                    if og_url:
                        post_url = og_url
                    if og_image:
                        media.append(og_image)
                else:
                    m_og_url = re.search(r'<meta[^>]+property=["\']og:url["\'][^>]+content=["\']([^"\']+)["\']', cont_text, re.I)
                    if m_og_url:
                        post_url = m_og_url.group(1)
                    m_og_image = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', cont_text, re.I)
                    if m_og_image:
                        media.append(m_og_image.group(1))
            else:
                # maybe JSON body with text fields
                if cont_text and (cont_text.strip().startswith('{') or cont_text.strip().startswith('[')):
                    try:
                        j = json.loads(cont_text)
                        texts = search_json_for_text(j)
                        if texts:
                            text = texts[0]
                    except Exception:
                        pass

                # if JSON parsing failed or no text found, try regex extraction on raw content
                if not text and cont_text:
                    # More aggressive text extraction: find all "text"/"message" fields with values
                    text_matches = []
                    
                    # Pattern 1: Standard escaped JSON (most common)
                    for m in TEXT_FIELD_RE.finditer(cont_text):
                        cand = unescape_json_string(m.group(2))
                        if cand and len(cand.strip()) > 80:  # meaningful text (at least 80 chars)
                            text_matches.append(cand)
                    
                    # Pattern 2: More flexible text pattern for heavily nested structures
                    flexible_pattern = re.compile(r'"(?:text|message|content|body|caption)"\s*:\s*"((?:\\.|[^"\\])*?)"(?:,|\})', re.IGNORECASE | re.DOTALL)
                    for m in flexible_pattern.finditer(cont_text):
                        try:
                            cand = unescape_json_string(m.group(1))
                            if cand and len(cand.strip()) > 80:
                                text_matches.append(cand)
                        except:
                            pass
                    
                    # Pattern 3: More aggressive pattern for escaped content (\\u sequences)
                    # Match text fields even with escaped unicode
                    aggressive_pattern = re.compile(r'"(?:text|message|content|body|caption|snippet|description|title|keyword_text)"\s*:\s*"((?:\\u[0-9a-fA-F]{4}|\\.|[^"\\])+?)"', re.IGNORECASE | re.DOTALL)
                    for m in aggressive_pattern.finditer(cont_text):
                        try:
                            raw_text = m.group(1)
                            # Try to unescape
                            try:
                                cand = json.loads('"' + raw_text + '"')
                            except:
                                cand = raw_text
                            # Then unescape HTML entities
                            cand = html.unescape(cand) if cand else ''
                            if cand and len(cand.strip()) > 80:
                                text_matches.append(cand)
                        except:
                            pass
                    
                    # Pattern 4: Find bootstrap_keywords with keyword_text patterns
                    # These appear in GraphQL responses with heavily nested escaping
                    bootstrap_pattern = re.compile(r'keyword_text["\']?\s*:\s*["\']+((?:\\\\.|[^"\'\\\\])*?)["\']', re.IGNORECASE | re.DOTALL)
                    for m in bootstrap_pattern.finditer(cont_text):
                        try:
                            raw_text = m.group(1)
                            # Unescape sequences like \\u00e0 
                            def unescape_unicode(s):
                                # Handle double-escaped unicode like \\u00e0
                                s = s.replace('\\\\u', '\\u')
                                try:
                                    return s.encode('utf-8').decode('unicode_escape')
                                except:
                                    return s
                            
                            cand = unescape_unicode(raw_text)
                            cand = html.unescape(cand) if cand else ''
                            if cand and len(cand.strip()) > 80:
                                text_matches.append(cand)
                        except:
                            pass
                    
                    # Pattern 5: Find nested message.text patterns (message object with text field)
                    # E.g. "message":{"text":"..."}
                    nested_message_pattern = re.compile(r'"message"\s*:\s*{\s*"text"\s*:\s*"((?:\\.|[^"\\])*?)"', re.IGNORECASE | re.DOTALL)
                    for m in nested_message_pattern.finditer(cont_text):
                        try:
                            cand = unescape_json_string(m.group(1))
                            if cand and len(cand.strip()) > 80:
                                text_matches.append(cand)
                        except:
                            pass
                    
                    # Deduplicate texts but keep all unique ones
                    if text_matches:
                        text_matches = list(OrderedDict.fromkeys(text_matches))  # dedupe
                        # Filter out very short or obviously junk text
                        text_matches = [t for t in text_matches if len(t.strip()) > 80]  # at least 80 chars minimum

            # media heuristics: check request URL and content for media links (improved regex)
            media_pattern_improved = re.compile(r'https?://[^\s"\'<>]+/(?:v/|photo|video|image)[^\s"\'<>]*|https?://(?:scontent|video|photos|images)[^\s"\'<>]*\.(?:fbcdn\.net|instagram\.com)[^\s"\'<>]*', re.I)
            if req_url and media_pattern_improved.search(req_url):
                media.append(req_url)
            if cont_text:
                found_media = media_pattern_improved.findall(cont_text)
                media += found_media
            
            # also search for the original MEDIA_EXT_RE pattern (for standard image extensions)
            if cont_text:
                media += find_media_urls(cont_text)

            # fallback post url
            if not post_url and req_url:
                post_url = req_url

            # dedupe media
            media = list(OrderedDict.fromkeys([m for m in media if m]))
            
            # filter to prefer long URLs with query parameters
            media = filter_media_urls(media)

            # Filter: skip items with too many media URLs (likely spam/junk)
            if len(media) > 20:
                continue

            # Create a result for each unique text found (if any), or one for media alone
            if text_matches:
                # One entry per text
                for text_item in text_matches:
                    key = text_item[:200]
                    if key in seen:
                        continue
                    seen.add(key)
                    results.append({'text': text_item, 'media_urls': media})
            elif media:
                # Only media, no text
                key = str(len(media))
                if key not in seen:
                    seen.add(key)
                    results.append({'text': text, 'media_urls': media})
        except Exception:
            continue

    print(json.dumps(results, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python3 scripts/extract_har_items.py /path/to/file.har.txt [min_size_kb] [output_file]', file=sys.stderr)
        print('  min_size_kb: optional minimum response size in KB (default: 0 = no filter)', file=sys.stderr)
        print('  output_file: optional output file path (default: stdout)', file=sys.stderr)
        print('', file=sys.stderr)
        print('Examples:', file=sys.stderr)
        print('  python3 scripts/extract_har_items.py test.har.txt', file=sys.stderr)
        print('  python3 scripts/extract_har_items.py test.har.txt 50', file=sys.stderr)
        print('  python3 scripts/extract_har_items.py test.har.txt 50 results.json', file=sys.stderr)
        sys.exit(1)
    
    har_path = sys.argv[1]
    min_size_kb = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    output_file = sys.argv[3] if len(sys.argv) > 3 else None
    
    # Run extraction
    import io
    from contextlib import redirect_stdout
    
    # Capture output
    output_buffer = io.StringIO()
    with redirect_stdout(output_buffer):
        main(har_path, min_size_kb=min_size_kb)
    
    result_json = output_buffer.getvalue()
    
    # Output to file or stdout
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(result_json)
        print(f'Results saved to: {output_file}', file=sys.stderr)
    else:
        print(result_json, end='')
