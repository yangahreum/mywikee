export type DashboardDoc = {
  id: string;
  title: string;
  project: string;
  updatedAt: string;
};

export type DashboardData = {
  totalCount: number;
  recent: DashboardDoc[];
};
