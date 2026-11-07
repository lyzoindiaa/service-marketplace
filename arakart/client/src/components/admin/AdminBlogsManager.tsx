import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, Plus, X, Edit3, Trash2, Eye, EyeOff } from 'lucide-react';
import {
  fetchBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  BlogItem,
} from '../../services/blogService';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Spinner } from '../common/Spinner';
import { focusFirstInvalidField } from '../../lib/focusFirstInvalid';

export const AdminBlogsManager: React.FC = () => {
  const { addToast } = useUiStore();
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [editingBlog, setEditingBlog] = useState<BlogItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [titleEn, setTitleEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [excerptEn, setExcerptEn] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [contentHi, setContentHi] = useState('');
  const [category, setCategory] = useState('Home Maintenance');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const loadBlogs = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const res = await fetchBlogs({ page: 1, limit: 50, includeDrafts: true });
      setBlogs(res.blogs || []);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to load blogs', 'error');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [addToast]);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  const resetForm = () => {
    setEditingBlog(null);
    setTitleEn('');
    setTitleHi('');
    setExcerptEn('');
    setContentEn('');
    setContentHi('');
    setCategory('Home Maintenance');
    setCoverImageUrl('');
    setIsPublished(true);
    setFieldErrors({});
    setShowForm(false);
  };

  const handleStartEdit = (blog: BlogItem) => {
    setEditingBlog(blog);
    setTitleEn(blog.titleEn);
    setTitleHi(blog.titleHi || '');
    setExcerptEn(blog.excerptEn || '');
    setContentEn(blog.contentEn);
    setContentHi(blog.contentHi || '');
    setCategory(blog.category || 'General');
    setCoverImageUrl(blog.coverImageUrl || '');
    setIsPublished(blog.isPublished);
    setFieldErrors({});
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!titleEn.trim()) {
      errors.titleEn = 'Please enter the blog title in English';
    }
    if (!contentEn.trim()) {
      errors.contentEn = 'Please enter the full article content in English';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const invalidIds: string[] = [];
      if (errors.titleEn) invalidIds.push('blog-title-en');
      if (errors.contentEn) invalidIds.push('blog-content-en');
      setTimeout(() => {
        focusFirstInvalidField(invalidIds);
      }, 0);
      return;
    }

    try {
      setSubmitting(true);
      if (editingBlog) {
        await updateBlog(editingBlog.id, {
          titleEn: titleEn.trim(),
          titleHi: titleHi.trim(),
          excerptEn: excerptEn.trim(),
          contentEn: contentEn.trim(),
          contentHi: contentHi.trim(),
          category,
          coverImageUrl: coverImageUrl.trim(),
          isPublished,
        });
        addToast('Blog post updated successfully', 'success');
      } else {
        await createBlog({
          titleEn: titleEn.trim(),
          titleHi: titleHi.trim(),
          excerptEn: excerptEn.trim(),
          contentEn: contentEn.trim(),
          contentHi: contentHi.trim(),
          category,
          coverImageUrl: coverImageUrl.trim(),
          isPublished,
        });
        addToast('Blog post created and published!', 'success');
      }
      resetForm();
      await loadBlogs(true);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to save blog post', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (blog: BlogItem) => {
    try {
      await updateBlog(blog.id, { isPublished: !blog.isPublished });
      addToast(
        !blog.isPublished ? 'Blog post published' : 'Blog post moved to drafts',
        'success'
      );
      await loadBlogs(true);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to update blog status', 'error');
    }
  };

  const handleDelete = async (blogId: string) => {
    try {
      await deleteBlog(blogId);
      addToast('Blog post deleted', 'success');
      await loadBlogs(true);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to delete blog post', 'error');
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-primary" />
            Official Blog & Articles Manager
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, update, publish, or delete blog posts displayed dynamically on the public /blogs page.
          </p>
        </div>
        <Button
          size="md"
          variant={showForm ? 'outline' : 'primary'}
          className="w-full sm:w-auto sm:min-w-[160px]"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              <span>Close Editor</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Add Blog Post</span>
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white p-6 rounded-2xl border border-brand-primary/30 shadow-sm space-y-4"
        >
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            {editingBlog ? `Edit Blog: ${editingBlog.titleEn}` : 'Create New Blog Post'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="blog-title-en" className="block text-xs font-bold text-slate-700 mb-1">
                Blog Title (English) *
              </label>
              <input
                id="blog-title-en"
                type="text"
                value={titleEn}
                onChange={(e) => {
                  setTitleEn(e.target.value);
                  if (fieldErrors.titleEn) {
                    setFieldErrors((prev) => ({ ...prev, titleEn: '' }));
                  }
                }}
                placeholder="e.g. Top 5 AC Maintenance Tips Before Peak Summer"
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl transition-colors focus:outline-none focus:ring-2 ${
                  fieldErrors.titleEn
                    ? 'border-red-500 ring-1 ring-red-500 text-red-900 focus:border-red-600 focus:ring-red-200'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
                }`}
              />
              {fieldErrors.titleEn && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{fieldErrors.titleEn}</p>
              )}
            </div>

            <div>
              <label htmlFor="blog-title-hi" className="block text-xs font-bold text-slate-700 mb-1">
                Blog Title (Hindi - Optional)
              </label>
              <input
                id="blog-title-hi"
                type="text"
                value={titleHi}
                onChange={(e) => setTitleHi(e.target.value)}
                placeholder="गर्मियों से पहले एसी रखरखाव के 5 टिप्स"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label htmlFor="blog-category" className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                id="blog-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-200"
              >
                <option value="Home Maintenance">Home Maintenance</option>
                <option value="Appliance Tips">Appliance Tips</option>
                <option value="City Guide">City Guide</option>
                <option value="Announcements">Announcements</option>
              </select>
            </div>

            <div>
              <label htmlFor="blog-cover-url" className="block text-xs font-bold text-slate-700 mb-1">
                Cover Image URL (Optional)
              </label>
              <input
                id="blog-cover-url"
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div>
            <label htmlFor="blog-excerpt" className="block text-xs font-bold text-slate-700 mb-1">
              Short Excerpt / Summary (Optional)
            </label>
            <input
              id="blog-excerpt"
              type="text"
              value={excerptEn}
              onChange={(e) => setExcerptEn(e.target.value)}
              placeholder="Brief summary shown on the blog card..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label htmlFor="blog-content-en" className="block text-xs font-bold text-slate-700 mb-1">
              Full Article Content (English) *
            </label>
            <textarea
              id="blog-content-en"
              rows={5}
              value={contentEn}
              onChange={(e) => {
                setContentEn(e.target.value);
                if (fieldErrors.contentEn) {
                  setFieldErrors((prev) => ({ ...prev, contentEn: '' }));
                }
              }}
              placeholder="Write the full blog article content here..."
              className={`w-full px-3.5 py-2.5 text-sm border rounded-xl transition-colors focus:outline-none focus:ring-2 ${
                fieldErrors.contentEn
                  ? 'border-red-500 ring-1 ring-red-500 text-red-900 focus:border-red-600 focus:ring-red-200'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
              }`}
            />
            {fieldErrors.contentEn && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">{fieldErrors.contentEn}</p>
            )}
          </div>

          <div>
            <label htmlFor="blog-content-hi" className="block text-xs font-bold text-slate-700 mb-1">
              Full Article Content (Hindi - Optional)
            </label>
            <textarea
              id="blog-content-hi"
              rows={3}
              value={contentHi}
              onChange={(e) => setContentHi(e.target.value)}
              placeholder="हिंदी में लेख सामग्री..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-200"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded border-slate-300 text-brand-primary"
              />
              Publish immediately to /blogs
            </label>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-full sm:w-auto sm:min-w-[160px]"
                onClick={resetForm}
              >
                Close
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full sm:w-auto sm:min-w-[160px]"
                isLoading={submitting}
              >
                {editingBlog ? 'Update Blog' : 'Add Blog Post'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {blogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No Blogs Created Yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Click &ldquo;Add Blog Post&rdquo; above to publish your first article.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs overflow-hidden"
            >
              <div className="space-y-1 flex-1 min-w-0 overflow-hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 break-all">{blog.titleEn}</h3>
                  <Badge variant={blog.isPublished ? 'success' : 'pending'}>
                    {blog.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                  <span className="text-xs font-semibold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                    {blog.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 break-all">{blog.excerptEn}</p>
                <p className="text-[11px] text-slate-400 break-all">
                  Slug: /blogs/{blog.slug} &bull; Updated{' '}
                  {new Date(blog.updatedAt).toLocaleDateString('en-IN')}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTogglePublish(blog)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  {blog.isPublished ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Publish
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleStartEdit(blog)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-brand-primary hover:bg-indigo-50"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(blog.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
