export interface MeLinkItem {
  label: string;
  href: string;
}

export interface MeTourItem {
  title: string;
  watched: boolean;
  isNew: boolean;
  route: Array<string>;
  click: (item: MeTourItem) => void;
}
