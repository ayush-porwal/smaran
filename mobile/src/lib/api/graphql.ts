import { ApiError, type AuthSession, type SignInInput, type SignUpInput } from './types';
import type {
  AddItemInput,
  CreateGroupInput,
  CreateListInput,
  Group,
  GroupMembership,
  GroupWithMeta,
  Invite,
  InviteLink,
  List,
  ListItem,
  Role,
  User,
} from './types';

import { getIdToken, getCurrentUser as getCachedCurrentUser, signIn as cognitoSignIn, signOut as cognitoSignOut } from '../auth';
import { config } from '../config';

async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  if (!config.graphqlEndpoint) {
    throw new ApiError('network', 'GraphQL endpoint not configured');
  }
  const token = await getIdToken();
  if (!token) {
    throw new ApiError('unauthenticated', 'no id token');
  }
  const res = await fetch(config.graphqlEndpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: token,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new ApiError('network', `HTTP ${res.status}`);
  }
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) {
    throw new ApiError('network', json.errors.map((e) => e.message).join('; '));
  }
  if (!json.data) {
    throw new ApiError('network', 'no data');
  }
  return json.data;
}

// AppSync has no signIn/signUp; Cognito hosted UI in auth.ts handles auth.

export async function signIn(_input: SignInInput): Promise<AuthSession> {
  const session = await cognitoSignIn();
  return session;
}

export async function signUp(_input: SignUpInput): Promise<AuthSession> {
  throw new ApiError('validation', 'Sign-up is via Google on the hosted UI');
}

export async function signOut(): Promise<void> {
  await cognitoSignOut();
}

export async function getCurrentUser(): Promise<User | null> {
  return getCachedCurrentUser();
}

const Q_MY_GROUPS = /* GraphQL */ `
  query MyGroups {
    myGroups {
      id
      name
      emoji
      color
      createdBy
      createdAt
      updatedAt
      role
      memberCount
      listCount
    }
  }
`;

const Q_GROUP = /* GraphQL */ `
  query Group($id: ID!) {
    group(id: $id) {
      id
      name
      emoji
      color
      createdBy
      createdAt
      updatedAt
      role
      memberCount
      listCount
    }
  }
`;

const Q_LIST_GROUP_MEMBERS = /* GraphQL */ `
  query ListGroupMembers($groupId: ID!) {
    listGroupMembers(groupId: $groupId) {
      groupId
      userId
      role
      joinedAt
      user {
        id
        email
        name
        createdAt
      }
    }
  }
`;

const Q_LISTS_IN_GROUP = /* GraphQL */ `
  query ListsInGroup($groupId: ID!) {
    listsInGroup(groupId: $groupId) {
      id
      groupId
      name
      emoji
      createdBy
      createdAt
      updatedAt
      order
    }
  }
`;

const Q_LIST = /* GraphQL */ `
  query List($id: ID!) {
    list(id: $id) {
      id
      groupId
      name
      emoji
      createdBy
      createdAt
      updatedAt
      order
    }
  }
`;

const Q_ITEMS_IN_LIST = /* GraphQL */ `
  query ItemsInList($listId: ID!) {
    itemsInList(listId: $listId) {
      id
      listId
      text
      checked
      addedBy
      createdAt
      updatedAt
      order
    }
  }
`;

const Q_PENDING_INVITES = /* GraphQL */ `
  query PendingInvites {
    pendingInvites {
      id
      groupId
      email
      invitedBy
      status
      createdAt
      expiresAt
      group {
        id
        name
        emoji
        color
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

const M_CREATE_GROUP = /* GraphQL */ `
  mutation CreateGroup($input: CreateGroupInput!) {
    createGroup(input: $input) {
      id
      name
      emoji
      color
      createdBy
      createdAt
      updatedAt
    }
  }
`;

const M_INVITE_TO_GROUP = /* GraphQL */ `
  mutation InviteToGroup($groupId: ID!, $email: String!) {
    inviteToGroup(groupId: $groupId, email: $email) {
      id
      groupId
      email
      invitedBy
      status
      createdAt
      expiresAt
    }
  }
`;

const M_ACCEPT_INVITE = /* GraphQL */ `
  mutation AcceptInvite($inviteId: ID!) {
    acceptInvite(inviteId: $inviteId) {
      id
      name
      emoji
      color
      createdBy
      createdAt
      updatedAt
    }
  }
`;

const M_CREATE_INVITE_LINK = /* GraphQL */ `
  mutation CreateGroupInviteLink($groupId: ID!) {
    createGroupInviteLink(groupId: $groupId) {
      groupId
      token
      createdBy
      createdAt
      expiresAt
    }
  }
`;

const M_JOIN_VIA_LINK = /* GraphQL */ `
  mutation JoinGroupViaLink($groupId: ID!, $token: String!) {
    joinGroupViaLink(groupId: $groupId, token: $token) {
      id
      name
      emoji
      color
      createdBy
      createdAt
      updatedAt
    }
  }
`;

const M_SET_MEMBER_ROLE = /* GraphQL */ `
  mutation SetMemberRole($groupId: ID!, $userId: ID!, $role: Role!) {
    setMemberRole(groupId: $groupId, userId: $userId, role: $role) {
      groupId
      userId
      role
      joinedAt
      user {
        id
        email
        name
        createdAt
      }
    }
  }
`;

const M_REMOVE_MEMBER = /* GraphQL */ `
  mutation RemoveMember($groupId: ID!, $userId: ID!) {
    removeMember(groupId: $groupId, userId: $userId)
  }
`;

const M_LEAVE_GROUP = /* GraphQL */ `
  mutation LeaveGroup($groupId: ID!) {
    leaveGroup(groupId: $groupId)
  }
`;

const M_DELETE_GROUP = /* GraphQL */ `
  mutation DeleteGroup($groupId: ID!) {
    deleteGroup(groupId: $groupId)
  }
`;

const M_CREATE_LIST = /* GraphQL */ `
  mutation CreateList($input: CreateListInput!) {
    createList(input: $input) {
      id
      groupId
      name
      emoji
      createdBy
      createdAt
      updatedAt
      order
    }
  }
`;

const M_DELETE_LIST = /* GraphQL */ `
  mutation DeleteList($listId: ID!) {
    deleteList(listId: $listId)
  }
`;

const M_ADD_ITEM = /* GraphQL */ `
  mutation AddItem($input: AddItemInput!) {
    addItem(input: $input) {
      id
      listId
      text
      checked
      addedBy
      createdAt
      updatedAt
      order
    }
  }
`;

const M_TOGGLE_ITEM = /* GraphQL */ `
  mutation ToggleItem($listId: ID!, $itemId: ID!) {
    toggleItem(listId: $listId, itemId: $itemId) {
      id
      listId
      text
      checked
      addedBy
      createdAt
      updatedAt
      order
    }
  }
`;

const M_UPDATE_ITEM_TEXT = /* GraphQL */ `
  mutation UpdateItemText($listId: ID!, $itemId: ID!, $text: String!) {
    updateItemText(listId: $listId, itemId: $itemId, text: $text) {
      id
      listId
      text
      checked
      addedBy
      createdAt
      updatedAt
      order
    }
  }
`;

const M_DELETE_ITEM = /* GraphQL */ `
  mutation DeleteItem($listId: ID!, $itemId: ID!) {
    deleteItem(listId: $listId, itemId: $itemId)
  }
`;

export async function listMyGroups(): Promise<GroupWithMeta[]> {
  const data = await gql<{ myGroups: GroupWithMeta[] }>(Q_MY_GROUPS);
  return data.myGroups;
}

export async function getGroup(groupId: string): Promise<GroupWithMeta> {
  const data = await gql<{ group: GroupWithMeta | null }>(Q_GROUP, { id: groupId });
  if (!data.group) throw new ApiError('not_found', 'group not found');
  return data.group;
}

export async function listGroupMembers(
  groupId: string,
): Promise<Array<GroupMembership & { user: User }>> {
  const data = await gql<{ listGroupMembers: Array<GroupMembership & { user: User }> }>(
    Q_LIST_GROUP_MEMBERS,
    { groupId },
  );
  return data.listGroupMembers;
}

export async function inviteToGroup(
  groupId: string,
  email: string,
): Promise<Invite> {
  const data = await gql<{ inviteToGroup: Invite }>(M_INVITE_TO_GROUP, { groupId, email });
  return data.inviteToGroup;
}

export async function listPendingInvites(): Promise<Invite[]> {
  const data = await gql<{ pendingInvites: Invite[] }>(Q_PENDING_INVITES);
  return data.pendingInvites;
}

export async function acceptInvite(inviteId: string): Promise<Group> {
  const data = await gql<{ acceptInvite: Group }>(M_ACCEPT_INVITE, { inviteId });
  return data.acceptInvite;
}

export async function createGroupInviteLink(groupId: string): Promise<InviteLink> {
  const data = await gql<{ createGroupInviteLink: InviteLink }>(M_CREATE_INVITE_LINK, {
    groupId,
  });
  return data.createGroupInviteLink;
}

export async function joinGroupViaLink(groupId: string, token: string): Promise<Group> {
  const data = await gql<{ joinGroupViaLink: Group }>(M_JOIN_VIA_LINK, { groupId, token });
  return data.joinGroupViaLink;
}

// Backend refuses to demote the last admin.
export async function setMemberRole(
  groupId: string,
  userId: string,
  role: Role,
): Promise<GroupMembership & { user: User }> {
  const data = await gql<{ setMemberRole: GroupMembership & { user: User } }>(
    M_SET_MEMBER_ROLE,
    { groupId, userId, role },
  );
  return data.setMemberRole;
}

export async function removeMember(groupId: string, userId: string): Promise<void> {
  await gql<{ removeMember: boolean }>(M_REMOVE_MEMBER, { groupId, userId });
}

// Sole member: group deleted. Last admin with others present: backend refuses until handoff.
export async function leaveGroup(groupId: string): Promise<void> {
  await gql<{ leaveGroup: boolean }>(M_LEAVE_GROUP, { groupId });
}

export async function deleteGroup(groupId: string): Promise<void> {
  await gql<{ deleteGroup: boolean }>(M_DELETE_GROUP, { groupId });
}

export async function listsInGroup(groupId: string): Promise<List[]> {
  const data = await gql<{ listsInGroup: List[] }>(Q_LISTS_IN_GROUP, { groupId });
  return data.listsInGroup;
}

export async function getList(listId: string): Promise<List> {
  const data = await gql<{ list: List | null }>(Q_LIST, { id: listId });
  if (!data.list) throw new ApiError('not_found', 'list not found');
  return data.list;
}

export async function createList(input: CreateListInput): Promise<List> {
  const data = await gql<{ createList: List }>(M_CREATE_LIST, { input });
  return data.createList;
}

export async function deleteList(listId: string): Promise<void> {
  await gql<{ deleteList: boolean }>(M_DELETE_LIST, { listId });
}

export async function itemsInList(listId: string): Promise<ListItem[]> {
  const data = await gql<{ itemsInList: ListItem[] }>(Q_ITEMS_IN_LIST, { listId });
  return data.itemsInList;
}

export async function addItem(input: AddItemInput): Promise<ListItem> {
  const data = await gql<{ addItem: ListItem }>(M_ADD_ITEM, { input });
  return data.addItem;
}

export async function toggleItem(listId: string, itemId: string): Promise<ListItem> {
  const data = await gql<{ toggleItem: ListItem }>(M_TOGGLE_ITEM, { listId, itemId });
  return data.toggleItem;
}

export async function updateItemText(
  listId: string,
  itemId: string,
  text: string,
): Promise<ListItem> {
  const data = await gql<{ updateItemText: ListItem }>(M_UPDATE_ITEM_TEXT, {
    listId,
    itemId,
    text,
  });
  return data.updateItemText;
}

export async function deleteItem(listId: string, itemId: string): Promise<void> {
  await gql<{ deleteItem: boolean }>(M_DELETE_ITEM, { listId, itemId });
}

export async function createGroup(input: CreateGroupInput): Promise<Group> {
  const data = await gql<{ createGroup: Group }>(M_CREATE_GROUP, { input });
  return data.createGroup;
}

export type Unsubscribe = () => void;
export type Listener = (data: { type: string }) => void;

export function subscribeToGroup(_groupId: string, _listener: Listener): Unsubscribe {
  // v1 stub: AppSync subscriptions need Lambda publish wiring; callers refetch after mutations.
  return () => {};
}

export function subscribeToList(_listId: string, _listener: Listener): Unsubscribe {
  return () => {};
}
