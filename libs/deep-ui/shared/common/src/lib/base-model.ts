export interface BaseModel {
  // todo - add team after we change 'group' in all services
  createdAt: string;
  createdBy: string;
  createdByUsername: string;
  modifiedAt: string;
  modifiedBy: string;
  modifiedByUsername: string;
}

export type SnakeCaseKeys<T> = {
  [K in keyof T as CamelToSnakeCase<K & string>]: T[K];
};

type CamelToSnakeCase<S extends string> = S extends `${infer Head}${infer Tail}`
  ? `${Head extends Uppercase<Head> ? '_' : ''}${Lowercase<Head>}${CamelToSnakeCase<Tail>}`
  : S;
