export type DashboardDoc = {
  id: string;
  title: string;
  slug: string;
  project: string;
  updatedAt: string;
};

export type DashboardData = {
  totalCount: number;
  recent: DashboardDoc[];
};
