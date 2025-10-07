import React from 'react';
import type { BlogPost } from '@/@/types';

interface BlogCardProps {
  post: BlogPost;
  onClick: () => void;
}

const BlogCard: React.FC<BlogCardProps> = ({ post, onClick }) => {
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div onClick={onClick} className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden flex flex-col cursor-pointer group transition-all duration-300 hover:border-brand-blue hover:shadow-lg hover:shadow-brand-blue/10 hover:-translate-y-1">
      <div className="aspect-video overflow-hidden">
        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <p className="text-sm font-semibold text-brand-blue mb-2">{post.category}</p>
        <h3 className="text-lg font-bold text-brand-text-primary mb-3 flex-grow">{post.title}</h3>
        <p className="text-sm text-brand-text-secondary mb-4">{post.excerpt}</p>
        <div className="flex items-center mt-auto text-xs text-brand-text-secondary">
          <img src={post.author.avatar} alt={post.author.name} className="w-7 h-7 rounded-full mr-2" />
          <span>{post.author.name} &bull; {formattedDate}</span>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
