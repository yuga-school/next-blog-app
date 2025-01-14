"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import type { Category } from "@/app/_types/Category";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

import DOMPurify from "isomorphic-dompurify";
import { twMerge } from "tailwind-merge";
type PostApiResponse = {
  id: string;
  title: string;
  content: string;
  coverImageURL: string;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
};
// 投稿記事の詳細表示 /posts/[id]
const Page: React.FC = () => {
  const [post, setPost] = useState<PostApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 動的ルートパラメータから 記事id を取得 （URL:/posts/[id]）
  const { id } = useParams() as { id: string };

  // コンポーネントが読み込まれたときに「1回だけ」実行する処理
  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/posts/${id}`, {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch post");
        }
        const data: PostApiResponse = await response.json();
        setPost(data);
      } catch (error) {
        console.error("Error fetching post:", error);
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  // 投稿データの取得中は「Loading...」を表示
  if (isLoading) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  // 投稿データが取得できなかったらエラーメッセージを表示
  if (!post) {
    return <div>指定idの投稿の取得に失敗しました。</div>;
  }

  // HTMLコンテンツのサニタイズ
  const safeHTML = DOMPurify.sanitize(post.content, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br"],
  });

  return (
    <main>
      <div className="space-y-2">
        <div className="mb-2 text-2xl font-bold">{post.title}</div>
        <div className="text-gray-500"></div>
        {post.coverImageURL && (
          <div>
            <Image
              src={post.coverImageURL}
              alt="Example Image"
              width={1365}
              height={768}
              priority
              className="rounded-xl"
            />
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: safeHTML }} />
        {post.categories.length === 0 ? (
          <div className="text-gray-500">
            （カテゴリは1個もつけられていません）
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap gap-2">
              {post.categories.map((category) => (
                <div
                  key={category.id}
                  className={twMerge(
                    "rounded-md px-2 py-0.5",
                    "border border-slate-900 text-slate-900"
                  )}
                >
                  {category.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Page;
