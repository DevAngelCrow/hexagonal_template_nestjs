export interface Menu {
  active: boolean;
  description: string;
  icon: string;
  name: string;
  order: number;
  id_parent?: string | null;
  parent: Menu | null;
  required_auth: boolean;
  show: boolean;
  title: string;
  uri: string;
  children: Menu[];
  id: string;
}

export type Child = Menu;
