import React, { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { getBlogPostBySlug, getRelatedPosts } from '../data/blogPosts';
import { Calendar, User, Tag, ArrowLeft, ArrowRight } from 'lucide-react';
import { useSEO } from '../components/SEO';

/**
 * Individual blog post page with SEO optimization
 */
const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPostBySlug(slug) : undefined;
  const relatedPosts = post ? getRelatedPosts(post.id) : [];

  // Dynamic SEO for blog post
  useSEO(post ? {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords.join(', '),
    ogTitle: post.metaTitle,
    ogDescription: post.metaDescription,
    canonical: `https://www.nexuschat.in/blog/${post.slug}`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.metaDescription,
      author: {
        '@type': 'Person',
        name: post.author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Nexus',
        url: 'https://www.nexuschat.in',
      },
      datePublished: post.publishDate,
      dateModified: post.lastModified,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://www.nexuschat.in/blog/${post.slug}`,
      },
    },
  } : undefined);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const categoryColors: Record<string, string> = {
    'ai-companions': 'bg-purple-100 text-purple-800',
    'confessions': 'bg-blue-100 text-blue-800',
    'guides': 'bg-green-100 text-green-800',
    'community': 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-16">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Blog
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Category Badge */}
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium mb-4 ${categoryColors[post.category]}`}>
          <Tag size={14} />
          {post.category.replace('-', ' ')}
        </span>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          {post.title}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 text-gray-600 mb-8 pb-8 border-b">
          <span className="flex items-center gap-2">
            <Calendar size={18} />
            {new Date(post.publishDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="flex items-center gap-2">
            <User size={18} />
            {post.author}
          </span>
          {post.lastModified !== post.publishDate && (
            <span className="text-sm text-gray-500">
              Updated: {new Date(post.lastModified).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
        </div>

        {/* Article Content */}
        <div 
          className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:my-6 prose-li:my-2 prose-table:my-8 prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
        />

        {/* Keywords */}
        <div className="mt-12 pt-8 border-t">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">KEYWORDS</h3>
          <div className="flex flex-wrap gap-2">
            {post.keywords.map((keyword) => (
              <span
                key={keyword}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mt-16">
          <h2 className="text-3xl font-bold mb-8">Related Articles</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.id}
                to={`/blog/${relatedPost.slug}`}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 group"
              >
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-3 ${categoryColors[relatedPost.category]}`}>
                  {relatedPost.category.replace('-', ' ')}
                </span>
                <h3 className="text-lg font-bold mb-2 group-hover:text-purple-600 transition-colors">
                  {relatedPost.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {relatedPost.excerpt}
                </p>
                <span className="inline-flex items-center gap-1 text-purple-600 text-sm font-medium">
                  Read More
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 mt-16">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Experience Nexus Today
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Chat with AI companions, share anonymous confessions, and join thousands of students
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/companion"
              className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-purple-50 transition-colors"
            >
              Try AI Companions Free
            </Link>
            <Link
              to="/"
              className="bg-purple-700 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-800 transition-colors border-2 border-white"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
