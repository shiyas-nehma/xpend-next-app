import React from 'react';
import type { BlogPost } from '../types';
import Header from '../../components/landing/Header';
import Footer from '../../components/landing/Footer';
import { ArrowLeftIcon } from '../../components/icons/NavIcons';

interface BlogDetailsPageProps {
  post: BlogPost;
  onBackToBlog: () => void;
  onEnterApp: (page: 'login' | 'signup') => void;
}

const BlogDetailsPage: React.FC<BlogDetailsPageProps> = ({ post, onBackToBlog, onEnterApp }) => {
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-brand-bg font-sans text-brand-text-primary antialiased">
        <Header onEnterApp={onEnterApp} onNavigateToBlog={onBackToBlog} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <article className="max-w-3xl mx-auto">
                <header className="mb-8">
                    <button onClick={onBackToBlog} className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors mb-6">
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Blog
                    </button>
                    <p className="text-brand-blue font-semibold mb-2">{post.category}</p>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-text-primary mb-4">
                        {post.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-brand-text-secondary">
                        <div className="flex items-center gap-2">
                            <img src={post.author.avatar} alt={post.author.name} className="w-8 h-8 rounded-full" />
                            <span>{post.author.name}</span>
                        </div>
                        <span>&bull;</span>
                        <time dateTime={post.date}>{formattedDate}</time>
                    </div>
                </header>
                
                <div className="aspect-video w-full rounded-2xl overflow-hidden mb-8 border border-brand-border">
                    <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                </div>

                <div className="prose prose-invert prose-lg max-w-none text-brand-text-secondary prose-headings:text-brand-text-primary prose-strong:text-brand-text-primary prose-a:text-brand-blue hover:prose-a:text-blue-400">
                    {post.content.split('\n').map((paragraph, index) => (
                        paragraph.startsWith('**') && paragraph.endsWith('**')
                            ? <h3 key={index} className="text-xl font-bold mt-6 mb-2 text-brand-text-primary">{paragraph.slice(2, -2)}</h3>
                            : <p key={index}>{paragraph}</p>
                    ))}
                </div>
            </article>
        </main>
        <Footer onNavigateToBlog={onBackToBlog} />
    </div>
  );
};

export default BlogDetailsPage;
