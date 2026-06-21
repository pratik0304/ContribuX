"use client";

import Link from "next/link";
import { 
  Search, 
  Users, 
  Palette, 
  Music, 
  BookOpen, 
  Gamepad2, 
  Video, 
  Mic, 
  GraduationCap, 
  Package, 
  Sparkles,
  X
} from "lucide-react";
import { useState, useEffect } from "react";

const categories = [
  { name: "All", icon: Users },
  { name: "Videos", icon: Video },
  { name: "Podcasts", icon: Mic },
  { name: "Visual Art", icon: Palette },
  { name: "Music", icon: Music },
  { name: "Writing/Newsletters", icon: BookOpen },
  { name: "Games/Game Mods", icon: Gamepad2 },
  { name: "Education/Courses", icon: GraduationCap },
  { name: "Physical Goods", icon: Package },
  { name: "Other", icon: Sparkles },
];

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      async function fetchCreators() {
        setLoading(true);
        try {
          const res = await fetch(`/api/creators?category=${activeCategory}&search=${encodeURIComponent(searchQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setCreators(data);
          }
        } catch (error) {
          console.error("Failed to fetch creators:", error);
        } finally {
          setLoading(false);
        }
      }
      fetchCreators();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [activeCategory, searchQuery]);

  const filteredCreators = creators;

  return (
    <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Explore <span className="text-gradient">Creators</span>
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">Discover amazing creators and support the work you love.</p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search creators or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-12 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all duration-300 placeholder-gray-600 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.name
                    ? "bg-white text-black"
                    : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                }`}
              >
                <IconComponent size={16} />
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Creator Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {filteredCreators.map((creator) => (
            <Link
              key={creator.id}
              href={`/creator/${creator.id}`}
              className="glass-card rounded-3xl p-6 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${creator.gradient} flex items-center justify-center text-white text-xl font-bold`}>
                  {creator.initial}
                </div>
                <div>
                  <h3 className="text-white font-bold group-hover:text-indigo-400 transition-colors">{creator.name}</h3>
                  <p className="text-xs text-gray-500">{creator.category}</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{creator.bio}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{creator.supporters.toLocaleString()} supporters</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full font-medium">
                  Support
                </span>
              </div>
            </Link>
          ))}
          </div>
        )}

        {!loading && filteredCreators.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No creators found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
