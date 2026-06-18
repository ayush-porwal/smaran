// Domain types. These mirror the AppSync / GraphQL schema in
// `infra/lib/graphql/schema.graphql`. The data layer lives in
// `lib/api/graphql.ts`; this file is the shared type surface.

export type ID = string;
export type ISODateString = string;

// Users
export type User = {
  id: ID;
  email: string;
  name: string;
  createdAt: ISODateString;
};

// Groups
export type GroupColor = 'indigo' | 'violet' | 'rose' | 'amber' | 'emerald' | 'sky';

export type Group = {
  id: ID;
  name: string;
  emoji: string;
  color: GroupColor;
  createdBy: ID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type Role = 'admin' | 'member';

export type GroupMembership = {
  groupId: ID;
  userId: ID;
  role: Role;
  joinedAt: ISODateString;
};

export type GroupWithMeta = Group & {
  role: Role;
  memberCount: number;
  listCount: number;
};

// Invites
export type InviteStatus = 'pending' | 'accepted' | 'expired';

export type Invite = {
  id: ID;
  groupId: ID;
  email: string;
  invitedBy: ID;
  status: InviteStatus;
  createdAt: ISODateString;
  expiresAt: ISODateString;
};

// Lists (and items)
export type List = {
  id: ID;
  groupId: ID;
  name: string;
  emoji: string;
  createdBy: ID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  // Order within a group. We don't use fractional indexing yet; positions
  // are sparse integers so inserts are cheap (max + 1).
  order: number;
};

export type ListItem = {
  id: ID;
  listId: ID;
  text: string;
  checked: boolean;
  addedBy: ID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  order: number;
};

// Auth
export type AuthSession = {
  user: User;
  // Cognito id token (JWT); attached as the bearer token on every
  // AppSync request.
  token: string;
};

export type SignUpInput = {
  email: string;
  password: string;
  name: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

// Inputs
export type CreateGroupInput = {
  name: string;
  emoji: string;
  color: GroupColor;
};

export type CreateListInput = {
  groupId: ID;
  name: string;
  emoji: string;
};

export type AddItemInput = {
  listId: ID;
  text: string;
};

// Errors
export type ApiErrorCode =
  | 'unauthenticated'
  | 'not_found'
  | 'forbidden'
  | 'validation'
  | 'conflict'
  | 'network';

export class ApiError extends Error {
  code: ApiErrorCode;
  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}
