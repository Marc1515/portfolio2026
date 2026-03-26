export interface Project {
  id: string;
  translationKey: string;
  tags: string[];
  repoUrl?: string;
  liveUrl?: string;
  image: string;
  featured: boolean;
}
