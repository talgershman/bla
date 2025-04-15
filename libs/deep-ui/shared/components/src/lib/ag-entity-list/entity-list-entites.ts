export interface EntityListActionButton<T> {
  isPrimary: boolean;
  id: string;
  label: string;
  icon?: string;
  selectedRequired?: boolean;
  tooltip?(entity: T): string;
  disableTooltip?(entity: T): boolean;
  isDisabled?(entity: T): boolean;
}
