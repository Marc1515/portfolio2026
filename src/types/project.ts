export interface ProjectDetails {
  overview: boolean;
  keyFeatures?: boolean;
  testing?: boolean;
  deployment?: boolean;
}

export interface Project {
  id: string;
  translationKey: string;
  tags: string[];
  modalTags?: string[];
  details?: ProjectDetails;
  repoUrl?: string;
  liveUrl?: string;
  image: string;
  featured: boolean;
}
