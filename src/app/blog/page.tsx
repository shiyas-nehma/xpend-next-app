'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { BlogPost } from '@/types';
import BlogCard from '@/components/blog/BlogCard';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import { MagnifyingGlassIcon } from '@/components/icons/NavIcons';
import { blogData } from '@/data/blogData';

export default function BlogPage() {
  const router = useRouter();
  const posts = blogData;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = useMemo(() => ['All', ...Array.from(new Set(posts.map((p: BlogPost) => p.category)))], [posts]);

  const filteredPosts = useMemo(() => 
    posts
      .filter((post: BlogPost) => activeCategory === 'All' || post.category === activeCategory)
      .filter((post: BlogPost) => post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())), 
    [posts, activeCategory, searchQuery]
  );

  const handleSelectPost = (slug: string) => {
    router.push(`/blogDetails?slug=${slug}`);
  };

  const handleNavigateHome = () => {
    router.push('/');
  };

  const handleEnterApp = (page: 'login' | 'signup') => {
    router.push(`/${page}`);
  };

  return (
    <div className="bg-brand-bg font-sans text-brand-text-primary antialiased">
        <Header onEnterApp={handleEnterApp} onNavigateToBlog={handleNavigateHome} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-text-primary">The Equota Blog</h1>
                <p className="max-w-2xl mx-auto text-lg text-brand-text-secondary mt-4">
                    Insights on finance, productivity, and growth from the Equota team.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div className="relative w-full sm:max-w-xs">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-brand-surface border border-brand-border rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${
                                activeCategory === category
                                ? 'bg-brand-blue text-white'
                                : 'bg-brand-surface-2 text-brand-text-secondary hover:bg-brand-border'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPosts.map(post => (
                        <BlogCard key={post.id} post={post} onClick={() => handleSelectPost(post.slug)} />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16">
                    <h3 className="text-xl font-semibold text-brand-text-primary">No Articles Found</h3>
                    <p className="text-brand-text-secondary mt-2">Try adjusting your search or filter criteria.</p>
                </div>
            )}
        </main>
        <Footer onNavigateToBlog={handleNavigateHome}/>
    </div>
  );
}
