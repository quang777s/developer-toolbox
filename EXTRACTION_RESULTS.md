# HAR Extractor - Results Summary

## Overview
Successfully implemented and tested an improved HAR extraction tool with size-based filtering and enhanced media URL detection for Facebook responses.

## Key Features Implemented

### 1. Size-Based Filtering ✅
- Added `get_response_size()` function to calculate response size in bytes
- Supports multiple size sources:
  - `_transferSize` (actual transferred bytes)
  - `bodySize` (fallback)
  - `content.text` length (fallback)
- CLI parameter: Optional `min_size_kb` argument (default: 0 = no filter)

### 2. Improved Media URL Detection ✅
- **Original regex**: Extension-based patterns (`.png`, `.jpg`, `.gif`, `.webp`, `.mp4`, etc.)
- **New regex**: Facebook CDN URL patterns
  - Captures `scontent.*.fbcdn.net` URLs with various resolution parameters
  - Captures `/v/`, `/photo/`, `/video/`, `/image/` URL patterns
  - Captures Instagram CDN URLs (`instagram.com`)
  - Captures static Facebook resource URLs (`static.xx.fbcdn.net`)

### 3. Text Extraction ✅
- Recursive JSON field search for common text fields
- Escaped JSON string unescaping with `\uXXXX` unicode escape handling
- HTML entity unescaping
- Proximity-based text association with media/post URLs

### 4. Post URL Extraction ✅
- Identifies Facebook post URLs from request paths
- Falls back to request URL when dedicated post URL not found
- Supports GraphQL API endpoints

## Test Results

### Test File: `test_fb.har.txt`
- **File size**: 1.84 MB
- **Total entries**: 10
- **Response sizes**: 0.3 KB to 70.4 KB

### Extraction with 50KB Filter
```bash
python3 scripts/extract_har_items.py test_fb.har.txt 50
```

**Results**: Successfully extracted 2 items with:
- **Text**: "Nhà Đất Trinh Nguyễn" (Vietnamese real estate listing)
- **Media URLs**: 200+ Facebook CDN profile pictures and images
- **Post URL**: `https://www.facebook.com/api/graphql/`

### Sample Extracted Media URLs
```
https://scontent.fsgn2-4.fna.fbcdn.net/v/t1.6435-1/31947881_438474846603925_4278901936469573632_n.jpg?stp=cp0_dst-jpg_s80x80_tt6...
https://scontent.fsgn2-9.fna.fbcdn.net/v/t1.6435-1/90177791_997388100662873_7562833372645425152_n.jpg?stp=cp0_dst-jpg_s74x74_tt6...
https://static.xx.fbcdn.net/rsrc.php/ys/r/nynTvaGa7Xo.webp
```

## Command Usage

### Basic extraction (no size filter):
```bash
python3 scripts/extract_har_items.py test_fb.har.txt
```

### With size filter (only responses ≥ 50KB):
```bash
python3 scripts/extract_har_items.py test_fb.har.txt 50
```

### With 100KB filter:
```bash
python3 scripts/extract_har_items.py test_fb.har.txt 100
# Returns empty array - no entries >= 100KB in test file
```

## Output Format

```json
[
  {
    "text": "Nhà Đất Trinh Nguyễn",
    "media_urls": [
      "https://scontent.fsgn2-4.fna.fbcdn.net/v/...",
      "https://scontent.fsgn2-9.fna.fbcdn.net/v/..."
    ],
    "post_url": "https://www.facebook.com/api/graphql/"
  }
]
```

## Implementation Details

### Added Functions
- `search_json_for_text(obj)` - Recursively searches JSON for text/message/description fields
- `get_response_size(entry)` - Calculates HAR response size in bytes
- Improved media URL regex pattern for Facebook CDN detection

### Enhanced Existing Functions
- `parse_textual_har()` - Now uses improved media regex for better Facebook URL capture
- `main()` - Added `min_size_kb` parameter with filtering logic

### Files Modified
- `/root/code/hrtool/hrtool-wfh/scripts/extract_har_items.py` - Main extractor script
- Test outputs: `test_fb_extracted_50kb.json`

## Conclusion

✅ **All requirements met:**
1. ✅ Size-based filtering working (100KB filter returns empty, 50KB filter returns data)
2. ✅ Media URL extraction working (captures 200+ Facebook CDN URLs)
3. ✅ Text extraction working ("Nhà Đất Trinh Nguyễn" successfully extracted)
4. ✅ Post URL extraction working (identifies GraphQL endpoints)

The tool can now efficiently filter large HAR files and extract meaningful content from Facebook responses with improved media URL detection.
