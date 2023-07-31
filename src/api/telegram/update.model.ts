import Decimal from "decimal.js";

export type TelegramUpdateResponse = {
  ok: boolean;
  result: Result[];
};

export type Result = {
  message: Message;
  update_id: Decimal;
};

export type Message = {
  chat: Chat;
  date: number;
  from: From;
  message_id: number;
  text: string;
  entities?: Entity[];
  forward_date?: number;
  forward_from_chat?: ForwardFromChat;
  forward_from_message_id?: number;
};

export type Chat = {
  all_members_are_administrators?: boolean;
  id: number;
  title?: string;
  type: string;
  first_name?: string;
  last_name?: string;
};

export type Entity = {
  length: number;
  offset: number;
  type: string;
};

export type ForwardFromChat = {
  id: number;
  title: string;
  type: string;
};

export type From = {
  first_name: string;
  id: number;
  is_bot: boolean;
  language_code: string;
  last_name: string;
};
