"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import PostSummary from "@/app/_components/PostSummary"; // コンポーネントのパスを調整してください
import type { Post } from "@/app/_types/Post"; // 型のパスを調整してください

const Page: React.FC = () => {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [subposts, setsubPosts] = useState<Post[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [categories, setcategories] = useState<string[] | null>(null);
  const [searchQuery, setSearchQuery] = useState<string[] | null>(null);
  const [keyword, setkeyword] = useState<string>("");
  const [searchMode, setSearchMode] = useState<"OR" | "AND">("OR");

  const handleSearch = () => {
    const filteredPosts = posts?.filter((post) => {
      const queryWords = searchQuery;
      if (searchMode === "OR") {
        return queryWords?.some((word) =>
          post.categories.some((category) => category.name.includes(word))
        );
      } else {
        return queryWords?.every((word) =>
          post.categories.some((category) => category.name.includes(word))
        );
      }
    });
    setsubPosts(filteredPosts || null);
  };

  const getEditDistance = (a: string, b: string): number => {
    const matrix = Array.from({ length: a.length + 1 }, () =>
      Array(b.length + 1).fill(0)
    );

    for (let i = 0; i <= a.length; i++) {
      for (let j = 0; j <= b.length; j++) {
        if (i === 0) {
          matrix[i][j] = j;
        } else if (j === 0) {
          matrix[i][j] = i;
        } else if (a[i - 1] === b[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] =
            1 +
            Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
        }
      }
    }

    return matrix[a.length][b.length];
  };

  const getTopCategories = (searchQuery: string): string[] => {
    const queryWords = searchQuery;
    const categoryArray = categories;
    const categoryDistances: { category: string; distance: number }[] = [];
    categoryArray?.forEach((category) => {
      const distance = getEditDistance(queryWords, category);
      categoryDistances.push({ category, distance });
    });

    categoryDistances.sort((a, b) => a.distance - b.distance);

    return categoryDistances.slice(0, 10).map((item) => item.category);
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const requestUrl = "/api/posts"; // データ取得元のエンドポイント
        const response = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store", // キャッシュを利用しない
        });
        if (!response.ok) {
          throw new Error("データの取得に失敗しました");
        }
        const data = (await response.json()) as Post[];
        const categoriesSet = new Set<string>();
        data.forEach((post) => {
          post.categories.forEach((category) => {
            categoriesSet.add(category.name);
          });
        });
        setcategories(Array.from(categoriesSet));
        setPosts(data);
        setsubPosts(data);
      } catch (e) {
        setFetchError(
          e instanceof Error ? e.message : "予期せぬエラーが発生しました"
        );
      }
    };
    fetchPosts();
  }, []);

  if (fetchError) {
    return <div className="text-red-500">{fetchError}</div>;
  }

  const addKeyword = (keyword: string) => {
    setSearchQuery((prev) => {
      if (!prev?.includes(keyword)) {
        return prev ? [...prev, keyword] : [keyword];
      }
      return prev;
    });
  };

  const removeKeyword = (keyword: string) => {
    setSearchQuery((prev) => prev?.filter((k) => k !== keyword) || null);
  };

  const handleDelete = async (postId: string) => {
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("削除に失敗しました");
      }
      setPosts(posts?.filter((post) => post.id !== postId) || null);
      setsubPosts(subposts?.filter((post) => post.id !== postId) || null);
    } catch (e) {
      setFetchError(
        e instanceof Error ? e.message : "予期せぬエラーが発生しました"
      );
    }
  };

  if (!posts) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <main>
      <div className="mb-2 text-2xl font-bold">投稿記事一覧</div>
      <div className="mb-4">
        <div className="flex justify-end">
          <Link
            href="/admin/posts/new"
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            新規作成
          </Link>
        </div>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setkeyword(e.target.value)}
          placeholder="検索語句を入力"
          className="mr-2 border p-2"
        />
        <div className="mt-2">
          <div className="mb-2 font-bold">キーワード一覧</div>
          <div className="flex flex-wrap">
            {searchQuery?.map((keyword, index) => (
              <div key={index} className="relative mb-2 mr-2">
                <span className="rounded bg-gray-200 px-2 py-1 text-sm">
                  {keyword}
                </span>
                <button
                  onClick={() => removeKeyword(keyword)}
                  className="absolute right-0 top-0 -mr-1 -mt-1 rounded-full bg-red-500 p-1 text-xs text-white opacity-50 hover:bg-red-600 hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2">
          <div className="mb-2 font-bold">カテゴリ候補</div>
          <div className="flex flex-wrap">
            {getTopCategories(keyword).map((category, index) => (
              <button
                key={index}
                onClick={() => addKeyword(category)}
                className="mb-2 mr-2 rounded bg-blue-200 px-2 py-1 text-sm hover:bg-blue-300"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <select
          value={searchMode}
          onChange={(e) => setSearchMode(e.target.value as "OR" | "AND")}
          className="mr-2 border p-2"
        >
          <option value="OR">OR</option>
          <option value="AND">AND</option>
        </select>
        <button onClick={handleSearch} className="bg-blue-500 p-2 text-white">
          検索
        </button>
        {posts && (
          <span className="ml-2">
            {subposts?.length} 件の投稿が見つかりました
          </span>
        )}
      </div>
      {subposts?.map((post: Post) => (
        <div key={post.id}>
          <PostSummary post={post} />
          <div className="mt-2 flex items-center justify-end">
            <div>
              <Link
                href={`/admin/posts/${post.id}`}
                className="mr-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                編集
              </Link>
              <button
                onClick={() => handleDelete(post.id)}
                className="mr-2 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      ))}
    </main>
  );
};

export default Page;
