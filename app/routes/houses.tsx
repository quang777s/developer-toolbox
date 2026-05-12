import { useEffect, useState } from "react";
import { Link } from "react-router";

interface House {
  text: string | null;
  media_urls: string[];
}

export function meta() {
  return [{ title: "Houses Database - Developer Toolbox" }];
}

export default function Houses() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [filterMedia, setFilterMedia] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [viewMode, setViewMode] = useState<"grid" | "detail">("grid");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetch("/houses.json")
      .then((res) => res.json())
      .then((data) => {
        setHouses(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load houses data:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== "detail" || selectedIndex === null) return;
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          if (prev === null) return 0;
          const nextIdx = prev < filteredHouses.length - 1 ? prev + 1 : 0;
          return nextIdx;
        });
        setSelectedImageIndex(0);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          if (prev === null) return 0;
          const nextIdx = prev > 0 ? prev - 1 : filteredHouses.length - 1;
          return nextIdx;
        });
        setSelectedImageIndex(0);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, selectedIndex]);

  const filteredHouses = houses.filter((house) => {
    if (!house.text) return false;
    
    const text = house.text.toLowerCase();
    
    // Filter out system messages and non-listing content
    const systemMessages = [
      "commenting has been turned off for this post",
      "anyone can see who's in the group and what they post",
      "tran mong hoai's photo",
      "thuhien nguyen's photo",
      "bảo quốc is in",
      "nguyễn quốc khoa's photo",
      "phạm thanh hà's photo",
      "nguyễn quang trường's photo",
      "anna lê added",
      "gởi lại",
    ];
    
    if (systemMessages.some(msg => text.includes(msg))) {
      return false;
    }
    
    const hasMedia = house.media_urls && house.media_urls.length > 0;
    const matchesSearch = !searchTerm || text.includes(searchTerm.toLowerCase());
    const matchesFilter = !filterMedia || hasMedia;

    // Simple price range filter based on text content
    let matchesPrice = true;
    if (priceRange.min || priceRange.max) {
      const priceMatch = text.match(/(\d+)\s*(?:ty|tỷ|tỷ|billion|triệu|tr)/i);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1]);
        if (priceRange.min && price < parseFloat(priceRange.min)) matchesPrice = false;
        if (priceRange.max && price > parseFloat(priceRange.max)) matchesPrice = false;
      }
    }

    return matchesSearch && matchesFilter && matchesPrice;
  });

  const sortedHouses = [...filteredHouses].sort((a, b) => {
    if (sortBy === "text-asc") {
      return (a.text || "").localeCompare(b.text || "");
    } else if (sortBy === "media-count") {
      return (b.media_urls?.length || 0) - (a.media_urls?.length || 0);
    }
    return 0;
  });

  const handleSelectListing = (index: number) => {
    setSelectedIndex(index);
    setSelectedImageIndex(0);
    setViewMode("detail");
  };

  if (loading) {
    return (
      <main className="pt-16 p-4 container mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Loading houses data...</p>
        </div>
      </main>
    );
  }

  const selectedHouse = selectedIndex !== null ? sortedHouses[selectedIndex] : null;

  return (
    <main className="pt-16 p-4 container mx-auto max-w-7xl">
      {/* Header */}
      <header className="mb-6">
        <Link to="/" className="text-blue-600 hover:text-blue-800 font-semibold text-sm mb-4 inline-block hover:underline">
          ← Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-2 text-gray-900">🏠 Houses Database</h1>
        <p className="text-gray-700 text-lg">
          Browsing <span className="font-bold text-blue-600 text-xl">{sortedHouses.length}</span> of{" "}
          <span className="font-bold text-blue-600 text-xl">{houses.length}</span> listings
        </p>
      </header>

      {/* Search and Filter Panel */}
      <div className="grid md:grid-cols-4 gap-4 mb-6 p-6 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg border-2 border-blue-300 shadow-lg">
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">🔍 Search Description</label>
          <input
            type="text"
            placeholder="Search text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm text-gray-900 placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">💰 Min Price (ty)</label>
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
            className="w-full px-3 py-2 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm text-gray-900 placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">💰 Max Price (ty)</label>
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
            className="w-full px-3 py-2 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm text-gray-900 placeholder-gray-500"
          />
        </div>

        <div className="flex flex-col justify-end gap-3">
          <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg bg-white border-2 border-blue-400 hover:bg-blue-50 transition-colors">
            <input
              type="checkbox"
              checked={filterMedia}
              onChange={(e) => setFilterMedia(e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
            <span className="text-sm font-semibold text-gray-800">📷 Only with images</span>
          </label>
        </div>
      </div>

      {/* View Controls */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg border-2 border-gray-200 shadow">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-4 py-2 rounded text-sm font-bold transition-all ${
              viewMode === "grid"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            📋 Grid View
          </button>
          <button
            onClick={() => setViewMode("detail")}
            className={`px-4 py-2 rounded text-sm font-bold transition-all ${
              viewMode === "detail"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            📄 Detail View
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold bg-white text-gray-800"
        >
          <option value="date">📅 Sort by Date (Default)</option>
          <option value="text-asc">🔤 Sort by Title (A-Z)</option>
          <option value="media-count">🖼️ Sort by Image Count</option>
        </select>
      </div>

      {/* Main Content */}
      {sortedHouses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">No listings found</p>
          <button
            onClick={() => {
              setSearchTerm("");
              setPriceRange({ min: "", max: "" });
              setFilterMedia(false);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        // Grid View
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedHouses.map((house, idx) => (
            <div
              key={idx}
              className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white flex flex-col"
            >
              {/* Image Gallery */}
              {house.media_urls && house.media_urls.length > 0 ? (
                <div className="relative">
                  {/* Main Image */}
                  <div className="bg-gray-200 aspect-video flex items-center justify-center overflow-hidden relative group">
                    <img
                      src={house.media_urls[0]}
                      alt="House"
                      className="w-full h-full object-cover cursor-pointer group-hover:opacity-90 transition-opacity"
                      onClick={() => handleSelectListing(idx)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ccc' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23666' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                      {house.media_urls.length} 📷
                    </div>
                  </div>

                  {/* Image Thumbnails Preview */}
                  {house.media_urls.length > 1 && (
                    <div className="flex gap-1 p-2 bg-gray-100 overflow-x-auto">
                      {house.media_urls.slice(0, 4).map((url, imgIdx) => (
                        <div
                          key={imgIdx}
                          className="flex-shrink-0 w-12 h-12 rounded overflow-hidden border border-gray-300 cursor-pointer hover:border-blue-500 hover:ring-1 hover:ring-blue-400"
                          onClick={() => handleSelectListing(idx)}
                        >
                          <img
                            src={url}
                            alt={`Preview ${imgIdx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect fill='%23ddd' width='48' height='48'/%3E%3C/svg%3E";
                            }}
                          />
                        </div>
                      ))}
                      {house.media_urls.length > 4 && (
                        <div className="flex-shrink-0 w-12 h-12 rounded bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-400"
                          onClick={() => handleSelectListing(idx)}
                        >
                          +{house.media_urls.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-200 aspect-video flex items-center justify-center">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}

              {/* Text Preview */}
              <div className="p-3 flex-1 flex flex-col">
                <p className="text-sm text-gray-800 line-clamp-3 mb-2 flex-1">
                  {house.text || "No description"}
                </p>
                <button 
                  onClick={() => handleSelectListing(idx)}
                  className="w-full px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  View All Images
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Detail View
        <div className="grid md:grid-cols-3 gap-6">
          {/* Listings List */}
          <div className="md:col-span-1 border rounded-lg overflow-hidden bg-gray-50 h-fit max-h-[80vh] flex flex-col">
            <div className="p-3 bg-blue-600 text-white font-semibold">
              Listings ({sortedHouses.length})
            </div>
            <div className="overflow-y-auto flex-1">
              {sortedHouses.map((house, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`p-3 border-b cursor-pointer transition-colors ${
                    selectedIndex === idx
                      ? "bg-blue-200 border-l-4 border-l-blue-600"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">#{idx + 1}</div>
                  <p className="text-sm text-gray-800 line-clamp-2 font-medium">
                    {house.text?.substring(0, 100) || "No text"}...
                  </p>
                  {house.media_urls && house.media_urls.length > 0 && (
                    <div className="text-xs text-blue-600 mt-1">📷 {house.media_urls.length} images</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Details Panel */}
          <div className="md:col-span-2 border rounded-lg overflow-hidden bg-white shadow">
            {selectedHouse ? (
              <div className="flex flex-col h-full max-h-[80vh] overflow-y-auto">
                {/* Image Gallery */}
                {selectedHouse.media_urls && selectedHouse.media_urls.length > 0 && (
                  <div className="bg-gray-200 flex flex-col">
                    {/* Main Image */}
                    <div className="aspect-video flex items-center justify-center relative overflow-hidden bg-gray-300">
                      <img
                        src={selectedHouse.media_urls[selectedImageIndex]}
                        alt={`House image ${selectedImageIndex + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ccc' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23666' font-size='16'%3EImage not available%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      {selectedHouse.media_urls.length > 1 && (
                        <>
                          <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm font-bold">
                            {selectedImageIndex + 1} / {selectedHouse.media_urls.length}
                          </div>
                          
                          {/* Navigation Arrows */}
                          <button
                            onClick={() => setSelectedImageIndex((prev) => prev > 0 ? prev - 1 : selectedHouse.media_urls.length - 1)}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all"
                          >
                            ← 
                          </button>
                          <button
                            onClick={() => setSelectedImageIndex((prev) => prev < selectedHouse.media_urls.length - 1 ? prev + 1 : 0)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all"
                          >
                            →
                          </button>
                        </>
                      )}
                    </div>

                    {/* Thumbnails */}
                    {selectedHouse.media_urls.length > 1 && (
                      <div className="p-3 bg-gray-100 border-t overflow-x-auto flex gap-2">
                        {selectedHouse.media_urls.map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                              selectedImageIndex === idx
                                ? "border-blue-600 ring-2 ring-blue-400"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            <img
                              src={url}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect fill='%23ddd' width='64' height='64'/%3E%3C/svg%3E";
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-6 flex-1">
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2">
                      Listing {selectedIndex !== null ? selectedIndex + 1 : "?"} of{" "}
                      {sortedHouses.length}
                    </div>
                    {selectedHouse.text && (
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">
                        {selectedHouse.text}
                      </p>
                    )}
                  </div>

                  {/* Images List */}
                  {selectedHouse.media_urls && selectedHouse.media_urls.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="font-semibold text-sm mb-3">
                        All Images ({selectedHouse.media_urls.length})
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedHouse.media_urls.map((url, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <button
                              onClick={() => setSelectedImageIndex(idx)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium min-w-[20px] text-left"
                            >
                              #{idx + 1}
                            </button>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-xs break-all flex-1"
                              title={url}
                            >
                              {url.substring(0, 80)}...
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-96 text-gray-500">
                Select a listing to view details
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Footer */}
      {sortedHouses.length > 0 && (
        <div className="mt-8 grid grid-cols-4 gap-4 p-6 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="text-4xl font-bold text-white">{sortedHouses.length}</div>
            <div className="text-sm text-blue-100 font-semibold mt-1">Matching Listings</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white">{houses.length}</div>
            <div className="text-sm text-blue-100 font-semibold mt-1">Total Listings</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white">
              {sortedHouses.filter((h) => h.media_urls?.length > 0).length}
            </div>
            <div className="text-sm text-blue-100 font-semibold mt-1">With Images</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white">
              {sortedHouses.reduce((sum, h) => sum + (h.media_urls?.length || 0), 0)}
            </div>
            <div className="text-sm text-blue-100 font-semibold mt-1">Total Images</div>
          </div>
        </div>
      )}
    </main>
  );
}
