import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, User, ArrowLeft, BookOpen, Search, Tag } from 'lucide-react';
import { fetchBlogs, fetchBlogBySlug, BlogItem } from '../services/blogService';
import { useUiStore } from '../store/uiStore';
import { Spinner } from '../components/common/Spinner';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const BlogsPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { language } = useUiStore();

  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const loadBlogsList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchBlogs({
        page: 1,
        limit: 24,
        category: activeCategory !== 'all' ? activeCategory : undefined,
        search: searchQuery.trim() || undefined,
      });
      setBlogs(res.blogs || []);
    } catch {
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  const loadSingleBlog = useCallback(async (targetSlug: string) => {
    try {
      setLoading(true);
      const blog = await fetchBlogBySlug(targetSlug);
      setSelectedBlog(blog);
    } catch {
      setSelectedBlog(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (slug) {
      loadSingleBlog(slug);
    } else {
      setSelectedBlog(null);
      loadBlogsList();
    }
  }, [slug, loadSingleBlog, loadBlogsList]);

  if (loading) {
    return (
      <div className="min-h-[450px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Detail View (/blogs/:slug)
  if (slug) {
    if (!selectedBlog) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {language === 'hi' ? 'ब्लॉग पोस्ट नहीं मिला' : 'Blog Post Not Found'}
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            {language === 'hi'
              ? 'यह लेख हटाया जा चुका है या उपलब्ध नहीं है।'
              : 'This article may have been removed or is no longer available.'}
          </p>
          <Button onClick={() => navigate('/blogs')}>
            {language === 'hi' ? 'सभी ब्लॉग देखें' : 'Back to All Blogs'}
          </Button>
        </div>
      );
    }

    const title =
      language === 'hi' && selectedBlog.titleHi
        ? selectedBlog.titleHi
        : selectedBlog.titleEn;
    const content =
      language === 'hi' && selectedBlog.contentHi
        ? selectedBlog.contentHi
        : selectedBlog.contentEn;

    return (
      <article className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <button
          onClick={() => navigate('/blogs')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'hi' ? 'सभी ब्लॉग पर वापस जाएं' : 'Back to Blogs'}
        </button>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {selectedBlog.coverImageUrl && (
            <div className="h-56 sm:h-80 w-full overflow-hidden bg-slate-100">
              <img
                src={selectedBlog.coverImageUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant="primary">{selectedBlog.category}</Badge>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <User className="w-3.5 h-3.5" />
                {selectedBlog.authorName}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(selectedBlog.publishedAt || selectedBlog.createdAt).toLocaleDateString(
                  'en-IN',
                  { day: 'numeric', month: 'short', year: 'numeric' }
                )}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-6 break-all">
              {title}
            </h1>

            <div className="prose max-w-none text-slate-700 leading-relaxed space-y-4 whitespace-pre-line text-sm sm:text-base break-all">
              {content}
            </div>
          </div>
        </div>
      </article>
    );
  }

  // List View (/blogs)
  const categories = ['all', 'Home Maintenance', 'Appliance Tips', 'City Guide', 'Announcements'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white mb-8">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            {language === 'hi' ? 'आराकार्ट ज्ञान केंद्र' : 'AraKart Knowledge Hub'}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            {language === 'hi'
              ? 'होम सर्विस गाइड और आधिकारिक ब्लॉग'
              : 'Home Service Guides & Official Blogs'}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base">
            {language === 'hi'
              ? 'हमारे एडमिन द्वारा प्रकाशित रखरखाव टिप्स, सुरक्षा गाइड और स्थानीय अपडेट पढ़ें।'
              : 'Read expert maintenance tips, appliance care guides, and platform announcements published by the AraKart Admin team.'}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? (language === 'hi' ? 'सभी लेख' : 'All Posts') : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'hi' ? 'ब्लॉग खोजें...' : 'Search articles...'}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>
      </div>

      {/* Blog Grid */}
      {blogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            {language === 'hi' ? 'अभी कोई ब्लॉग प्रकाशित नहीं हुआ है' : 'No Blog Posts Published Yet'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {language === 'hi'
              ? 'जब एडमिन नए ब्लॉग और सर्विस गाइड पोस्ट करेंगे, तो वे यहाँ गतिशील रूप से दिखाई देंगे।'
              : 'Articles published by the Admin from the Admin Console will automatically appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => {
            const title = language === 'hi' && blog.titleHi ? blog.titleHi : blog.titleEn;
            const excerpt =
              language === 'hi' && blog.excerptHi ? blog.excerptHi : blog.excerptEn;

            return (
              <div
                key={blog.id}
                onClick={() => navigate(`/blogs/${blog.slug}`)}
                className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-brand-primary/40 transition-all cursor-pointer flex flex-col"
              >
                {blog.coverImageUrl ? (
                  <div className="h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={blog.coverImageUrl}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-36 w-full bg-gradient-to-br from-indigo-50 to-amber-50 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-brand-primary/40" />
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-full">
                        <Tag className="w-3 h-3" />
                        {blog.category}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-primary transition-colors line-clamp-2 mb-2 break-all">
                      {title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed break-all">
                      {excerpt}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">{blog.authorName}</span>
                    <span className="font-semibold text-brand-primary group-hover:translate-x-0.5 transition-transform">
                      {language === 'hi' ? 'पूरा पढ़ें →' : 'Read Article →'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
