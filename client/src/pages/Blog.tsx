import React from 'react';
import { Link } from 'react-router-dom';
import { getAllBlogPosts, BlogPost } from '../data/blogPosts';
import { Calendar, User, Tag, ArrowRight } from 'lucide-react';

/**
 * Blog listing page - Hidden from main navigation but accessible for SEO
 */
const Blog: React.FC = () => {
  const posts = getAllBlogPosts();

  const categoryColors: Record<string, string> = {
    'ai-companions': 'bg-purple-100 text-purple-800',
    'confessions': 'bg-blue-100 text-blue-800',
    'guides': 'bg-green-100 text-green-800',
    'community': 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Nexus Blog
          </h1>
          <p className="text-xl text-purple-100 max-w-2xl">
            Guides, tips, and insights about AI companions, college confessions, and anonymous communities
          </p>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: BlogPost) => (
            <article
              key={post.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
            >
              {/* Category Badge */}
              <div className="p-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${categoryColors[post.category]}`}>
                  <Tag size={14} />
                  {post.category.replace('-', ' ')}
                </span>
              </div>

              {/* Content */}
              <div className="px-4 pb-4">
                <h2 className="text-xl font-bold mb-3 group-hover:text-purple-600 transition-colors">
                  <Link to={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(post.publishDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={14} />
                    {post.author}
                  </span>
                </div>

                {/* Read More Link */}
                <Link
                  to={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-purple-600 font-medium hover:text-purple-700 transition-colors"
                >
                  Read Full Article
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Try Nexus?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Chat with AI companions, share anonymous confessions, and join our community
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/companion"
              className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-purple-50 transition-colors"
            >
              Try AI Companions
            </Link>
            <Link
              to="/campus/general/confessions"
              className="bg-purple-700 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-800 transition-colors"
            >
              Read Confessions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;
