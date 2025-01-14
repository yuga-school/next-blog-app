import { Category } from "./Category";
import { CoverImage } from "./CoverImage";

export type Post = {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: string;
  categories: Category[];
  coverImage: CoverImage;
};
