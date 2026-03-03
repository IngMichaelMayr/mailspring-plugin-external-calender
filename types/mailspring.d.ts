// Type declarations for Mailspring plugin APIs

declare module 'mailspring-exports' {
  import * as React from 'react';

  // Core App Environment
  export const AppEnv: {
    getConfigDirPath(): string;
    showErrorDialog(title: string, message?: string): void;
    config: {
      get(key: string): any;
      set(key: string, value: any): void;
      onDidChange(key: string, callback: () => void): Disposable;
    };
    commands: {
      add(target: any, commands: Record<string, () => void>): Disposable;
    };
  };

  // Disposable
  export interface Disposable {
    dispose(): void;
  }

  // Actions
  export const Actions: {
    focusMailboxPerspective(perspective: MailboxPerspective): void;
    selectRootSheet(sheet: any): void;
    [key: string]: any;
  };

  // WorkspaceStore
  export const WorkspaceStore: {
    defineSheet(
      name: string,
      options: { root: boolean },
      columns: Record<string, any>
    ): any;
    Sheet: Record<string, any>;
    Location: {
      Center: any;
      [key: string]: any;
    };
  };

  // ComponentRegistry
  export const ComponentRegistry: {
    register(
      component: React.ComponentType<any>,
      options: {
        role?: string;
        location?: any;
        modes?: string[];
      }
    ): void;
    unregister(component: React.ComponentType<any>): void;
  };

  // ExtensionRegistry
  export const ExtensionRegistry: {
    AccountSidebar: {
      register(extension: AccountSidebarExtension): void;
      unregister(extension: AccountSidebarExtension): void;
    };
  };

  export interface AccountSidebarExtension {
    name: string;
    sidebarItem(accountIds: string[]): SidebarItem | SidebarItem[];
  }

  export interface SidebarItem {
    id: string;
    name: string;
    iconName: string;
    perspective: MailboxPerspective;
    children?: SidebarItem[];
  }

  // MailboxPerspective
  export class MailboxPerspective {
    static forStarred(accountIds: string[]): MailboxPerspective;
    static forInbox(accountIds: string[]): MailboxPerspective;

    constructor(accountIds?: string[]);

    name: string;
    iconName: string;
    accountIds: string[];
    sheet(): any;
    isEqual(other: MailboxPerspective): boolean;
    threads(): any;
    canReceiveThreadsFromAccountIds(accountIds: string[]): boolean;
    receiveThreads(threadIds: string[]): Promise<void>;
    tasksForRemovingItems(threads: any[], source?: string): any[];
    unreadCount(): number;
  }

  // AccountStore
  export const AccountStore: {
    accounts(): Account[];
    accountForId(id: string): Account | undefined;
    accountIds(): string[];
    listen(callback: () => void, context?: any): () => void;
  };

  export interface Account {
    id: string;
    name: string;
    emailAddress: string;
    provider: string;
  }

  // FocusedPerspectiveStore
  export const FocusedPerspectiveStore: {
    current(): MailboxPerspective;
    listen(callback: () => void, context?: any): () => void;
    trigger(): void;
  };

  // KeyManager
  export const KeyManager: {
    getPassword(service: string, account: string): Promise<string | null>;
    replacePassword(
      service: string,
      account: string,
      password: string
    ): Promise<void>;
    deletePassword(service: string, account: string): Promise<void>;
  };

  // Thread & Message
  export interface Thread {
    id: string;
    subject: string;
    participants: Contact[];
    lastMessageReceivedTimestamp: number;
  }

  export interface Message {
    id: string;
    subject: string;
    from: Contact[];
    to: Contact[];
    cc: Contact[];
    date: Date;
    body: string;
    snippet: string;
  }

  export interface Contact {
    name: string;
    email: string;
  }

  // MessageStore
  export const MessageStore: {
    items(): Message[];
    listen(callback: () => void, context?: any): () => void;
  };

  // FocusedContentStore
  export const FocusedContentStore: {
    focused(collection: string): any;
    listen(callback: () => void, context?: any): () => void;
  };

  // Thread store
  export const ThreadStore: {
    [key: string]: any;
  };

  // React prop types provided by Mailspring
  export const MailspringComponentKit: any;

  // Reflux-like store
  export class MailspringStore {
    listenTo(store: any, callback: () => void): void;
    trigger(): void;
    listen(callback: () => void, context?: any): () => void;
  }

  // NativeNotifications
  export const NativeNotifications: {
    doNotDisturb(): boolean;
    displayNotification(opts: {
      title?: string;
      subtitle?: string;
      body?: string;
      tag?: string;
      canReply?: boolean;
      onActivate?: (args?: any) => void;
    }): Notification | null;
  };

  // Utils
  export const Utils: {
    generateTempId(): string;
    [key: string]: any;
  };

  // DatabaseStore
  export const DatabaseStore: {
    [key: string]: any;
  };

  // Localized
  export function localized(str: string, ...args: any[]): string;
}

declare module 'mailspring-component-kit' {
  import * as React from 'react';

  export class MiniMonthView extends React.Component<{
    value?: Date;
    onChange?: (date: Date) => void;
  }> {}

  export class Flexbox extends React.Component<{
    direction?: 'row' | 'column';
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
  }> {}

  export class ScrollRegion extends React.Component<{
    className?: string;
    children?: React.ReactNode;
    style?: React.CSSProperties;
  }> {}

  export class Spinner extends React.Component<{
    visible?: boolean;
    style?: React.CSSProperties;
  }> {}

  export class RetinaImg extends React.Component<{
    name: string;
    mode: string;
    style?: React.CSSProperties;
    className?: string;
  }> {
    static Mode: {
      ContentPreserve: string;
      ContentIsMask: string;
      ContentDark: string;
      ContentLight: string;
    };
  }

  export class KeyCommandsRegion extends React.Component<{
    globalHandlers?: Record<string, () => void>;
    localHandlers?: Record<string, () => void>;
    children?: React.ReactNode;
  }> {}

  export class Popover extends React.Component<{
    children?: React.ReactNode;
    direction?: string;
    buttonComponent?: React.ReactNode;
  }> {}

  export const DateUtils: {
    format(date: Date, format?: string): string;
    [key: string]: any;
  };
}

declare module 'mailspring-store' {
  export default class MailspringStore {
    listenTo(store: any, callback: () => void): void;
    trigger(): void;
    listen(callback: () => void, context?: any): () => void;
  }
}
