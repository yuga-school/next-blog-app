"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Category {
  id: number;
  name: string;
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  useEffect(() => {
    // Fetch categories from your API or data source
    const fetchCategories = async () => {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setCategories(data);
    };

    fetchCategories();
  }, []);
  const getEditDistance = (a: string, b: string): number => {
    const matrix = Array.from({ length: a.length + 1 }, () =>
      Array(b.length + 1).fill(0)
    );

    const lowerA = a.toLowerCase();
    const lowerB = b.toLowerCase();

    for (let i = 0; i <= lowerA.length; i++) {
      for (let j = 0; j <= lowerB.length; j++) {
        if (i === 0) {
          matrix[i][j] = j;
        } else if (j === 0) {
          matrix[i][j] = i;
        } else if (lowerA[i - 1] === lowerB[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] =
            1 +
            Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
        }
      }
    }

    return matrix[lowerA.length][lowerB.length];
  };

  const getTopCategories = (searchQuery: string): Category[] => {
    const queryWords = searchQuery;
    const categoryArray = categories;
    const categoryDistances: { category: Category; distance: number }[] = [];
    categoryArray?.forEach((category) => {
      const distance = getEditDistance(queryWords, category.name);
      categoryDistances.push({
        category,
        distance: distance / Number(category.name.length),
      });
    });

    categoryDistances.sort((a, b) => a.distance - b.distance);

    return categoryDistances
      .slice(0, categoryDistances.length)
      .map((item) => item.category);
  };
  const handleEdit = (id: number) => {
    // Navigate to the edit page
    router.push(`/admin/categories/${id}`);
  };

  const handleDelete = async (c: Category) => {
    // prettier-ignore
    if (!window.confirm(`カテゴリ「${c.name}」を本当に削除しますか？`)) {
      return;
    }
    try {
      const requestUrl = `/api/admin/categories/${c.id}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      // カテゴリの一覧ページを更新
      setCategories(categories.filter((category) => category.id !== c.id));
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `カテゴリのDELETEリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
    }
  };
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">カテゴリ一覧</h1>
      <div className="mb-4 flex justify-end">
        <Link
          href="/admin/categories/new"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          新規作成
        </Link>
      </div>
      <div className="mb-4">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="検索語句を入力"
          className="mr-2 w-full border p-2 md:w-auto"
        />
        <label className="block md:mr-2 md:inline-block">カテゴリを検索</label>
      </div>
      <ul>
        {categories.length === 0 ? (
          <div className="text-gray-500">
            （カテゴリは1個も作成されていません）
          </div>
        ) : (
          getTopCategories(keyword).map((category: Category) => (
            <li key={category.id} className="mb-4">
              <div className="rounded-md border p-4">
                <div className="text-lg">{category.name}</div>
                <div className="mt-2 flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
                  <button
                    onClick={() => handleEdit(category.id)}
                    className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                  >
                    削除
                  </button>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default CategoriesPage;
