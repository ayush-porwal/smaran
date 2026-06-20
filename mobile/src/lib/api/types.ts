// Mirrors infra/lib/graphql/schema.graphql.
export type ID = string;
export type ISODateString = string;

export type User = {
  id: ID;
  email: string;
  name: string;
  createdAt: ISODateString;
};

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

export type InviteStatus = 'pending' | 'accepted' | 'expired';

export type Invite = {
  id: ID;
  groupId: ID;
  email: string;
  invitedBy: ID;
  status: InviteStatus;
  createdAt: ISODateString;
  expiresAt: ISODateString;
  // Present on invites returned by `listPendingInvites` so the UI can
  // name the group; absent on the invite returned by `inviteToGroup`.
  group?: Group;
};

export type InviteLink = {
  groupId: ID;
  token: string;
  createdBy: ID;
  createdAt: ISODateString;
  expiresAt: ISODateString;
};

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

export type AuthSession = {
  user: User;
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
