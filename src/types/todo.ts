export type TodoStatus = 'pending' | 'completed';

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  created_at: string;
  updated_at: string;
}

export interface TodoInput {
  title: string;
  description: string;
}
