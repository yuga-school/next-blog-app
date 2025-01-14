import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const rawPosts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        coverImageURL: true,
        createdAt: true,
        updatedAt: true,
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // 取得後に “categories: [ { category: { id, name } } ]” を
    // “categories: [ { id, name }, … ]” という形に変換
    const flattenedPosts = rawPosts.map((post) => {
      return {
        ...post,
        categories: post.categories.map((c) => ({
          id: c.category.id,
          name: c.category.name,
        })),
      };
    });

    return NextResponse.json(flattenedPosts);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "投稿記事の取得に失敗しました" },
      { status: 500 }
    );
  }
};
